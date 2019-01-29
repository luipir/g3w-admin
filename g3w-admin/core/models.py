from __future__ import unicode_literals
from django.conf import settings
from django.conf.global_settings import LANGUAGES
from django.utils.translation import ugettext, ugettext_lazy as _
from django.core.urlresolvers import reverse
from django.db import models
from django.apps import apps
from guardian.shortcuts import get_objects_for_user
from ordered_model.models import OrderedModel
from model_utils.models import TimeStampedModel
from model_utils import Choices
from autoslug import AutoSlugField
from sitetree.models import TreeItemBase, TreeBase
from django.contrib.auth.models import User, Group as AuthGroup
from usersmanage.utils import setPermissionUserObject, getUserGroups, get_users_for_object
from usersmanage.configs import *
from .utils.structure import getProjectsByGroup
try:
    from osgeo import osr
except:
    pass


class G3W2Tree(TreeBase):
    module = models.CharField('Qdjango2 Module', max_length=50, null=True, blank=True)


class G3W2TreeItem(TreeItemBase):
    type_header = models.BooleanField('Tipo header', default=False, blank=True)
    icon_css_class = models.CharField('Icon css class', max_length=50,null=True, blank=True)


class G3WSpatialRefSys(models.Model):
    """
    Clone of Postgis spatial_ref_sys for no geo database
    """
    srid = models.IntegerField(primary_key=True)
    auth_name = models.CharField(max_length=256)
    auth_srid = models.IntegerField()
    srtext = models.CharField(max_length=2048)
    proj4text = models.CharField(max_length=2048)

    def __unicode__(self):
        '''
        try:
            sref = osr.SpatialReference()
            sref.ImportFromWkt(self.srtext)
            return "{} - [{}] - {}".format(str(self.srid), sref.GetLinearUnitsName(), sref.GetAttrValue())
        except Exception as e:
        '''
        return "{} {}".format(self.auth_name, str(self.srid))


class BaseLayer(models.Model):
    """
    Model to store Base layers
    """
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    icon = models.ImageField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    property = models.TextField()

    def __unicode__(self):
        return "{} ({})".format(self.title, self.name)

    class Meta:
        verbose_name = 'Base Layer'
        verbose_name_plural = 'Base Layers'


class MapControl(OrderedModel):
    """
    Model for Map Controls: zoom, query, etc..
    """
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    def __unicode__(self):
        return self.name

    class Meta(OrderedModel.Meta):
        verbose_name = _('Map control')
        verbose_name_plural = _('Map controls')


class MacroGroup(TimeStampedModel, OrderedModel):
    """
    Model for Macro groups, no ACL
    """

    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    logo_img = models.FileField(_('Logo image'), upload_to='macrogroup/logo_img')
    logo_link = models.URLField(_('Logo link'), blank=True, null=True,
                                       help_text=_('Enter link with http:// or https//'))
    use_title_logo_client = models.BooleanField(_('Use title and logo for client'), default=False)

    slug = AutoSlugField(
        _('Slug'), populate_from='title', unique=True, always_update=True
    )

    class Meta:
        permissions = (
            ('view_macrogroup', 'Can view macro group maps'),
        )

    def __unicode__(self):
        return self.title

    def _permissions_to_editors(self, users_id, mode='add'):

        for user_id in users_id:
            setPermissionUserObject(User.objects.get(pk=user_id), self, permissions='view_macrogroup', mode=mode)

    def add_permissions_to_editors(self, users_id):
        """
        Give guardian permissions to Editors
        """
        self._permissions_to_editors(users_id, 'add')

    def remove_permissions_to_editors(self, users_id):
        """
        Remove guardian permissions to Editors
        """
        self._permissions_to_editors(users_id, 'remove')


class Group(TimeStampedModel, OrderedModel):
    """A group of projects."""
    # General info
    name = models.CharField(_('Name'), max_length=255, unique=True)
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    slug = AutoSlugField(
        _('Slug'), populate_from='name', unique=True, always_update=True
        )
    is_active = models.BooleanField(_('Is active'), default=1)

    # l10n
    lang = models.CharField(_('lang'), max_length=20, choices=LANGUAGES, default='it')

    # Company logo
    header_logo_img = models.FileField(_('Logo image'), upload_to='logo_img')
    header_logo_link = models.URLField(_('Logo link'), blank=True, null=True,
                                       help_text=_('Enter link with http:// or https//'))

    # Group SRID (a.k.a. EPSG)
    srid = models.ForeignKey(G3WSpatialRefSys, db_column='srid')

    # baselayers
    baselayers = models.ManyToManyField(BaseLayer, blank=True)

    # mapcontrols
    mapcontrols = models.ManyToManyField(MapControl)

    # background color map default
    background_color = models.CharField(max_length=7, default='#ffffff', blank=True)

    # Company TOS
    header_terms_of_use_text = models.TextField(
        _('Terms of use text'), blank=True
        )
    header_terms_of_use_link = models.URLField(
        _('Terms of use link'), blank=True
        )

    macrogroups = models.ManyToManyField(MacroGroup, blank=True)

    class Meta:
        permissions = (
            ('view_group', 'Can view group'),
        )

    def __unicode__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('group-detail', kwargs={'slug': self.slug})

    def get_panoramic_project(self):
        try:
            group_pano_project = GroupProjectPanoramic.objects.get(group=self)
            Project = apps.get_app_config(group_pano_project.project_type).get_model('project')
            return Project.objects.get(pk=group_pano_project.project_id)
        except:
            return None

    def getProjects(self):
        """
        Get every type projects for group
        """
        groupProjects = []
        for g3wProjectApp in settings.G3WADMIN_PROJECT_APPS:
            Project = apps.get_app_config(g3wProjectApp).get_model('project')
            projects = Project.objects.filter(group=self).order_by('title')
            groupProjects += [(g3wProjectApp, project) for project in projects]
        return groupProjects

    def getProjectsNumber(self, user=None):
        """
        Count total number of serveral type project
        :return: integer
        """
        groupProjects = 0
        for g3wProjectApp in settings.G3WADMIN_PROJECT_APPS:
            Project = apps.get_app_config(g3wProjectApp).get_model('project')
            if user:
                groupProjects +=len(get_objects_for_user(user, '{}.view_project'.format(g3wProjectApp), Project) \
                    .filter(group=self))
            else:
                groupProjects += len(Project.objects.filter(group=self))
        return groupProjects

    def addPermissionsToEditor(self, user):
        """
        Give guardian permissions to Editor
        """

        permissions = ['view_group']
        if G3W_EDITOR1 in getUserGroups(user):
            permissions += [
                'change_group',
                'delete_group'
            ]

        setPermissionUserObject(user, self, permissions=permissions)

        # adding permissions to projects
        appProjects = getProjectsByGroup(self)
        for app, projects in appProjects.items():
            for project in projects:
                project.addPermissionsToEditor(user)

    def removePermissionsToEditor(self, user):
        """
        Remove guardian permissions to Editor
        """

        setPermissionUserObject(user, self, permissions=[
            'change_group',
            'delete_group',
            'view_group',
        ], mode='remove')

        # adding permissions to projects
        appProjects = getProjectsByGroup(self)
        for app, projects in appProjects.items():
            for project in projects:
                project.removePermissionsToEditor(user)

    def addPermissionsToViewers(self, users_id):
        """
        Give guardian permissions to Viewers
        """
        appProjects = getProjectsByGroup(self)

        for user_id in users_id:
            setPermissionUserObject(User.objects.get(pk=user_id), self, permissions='view_group')

            # adding permissions to projects
            for app, projects in appProjects.items():
                for project in projects:
                    project.addPermissionsToViewers(users_id)

    def removePermissionsToViewers(self, users_id):
        """
        Remove guardian permissions to Viewers
        """
        appProjects = getProjectsByGroup(self)

        for user_id in users_id:
            setPermissionUserObject(User.objects.get(pk=user_id), self, permissions='view_group', mode='remove')

            # adding permissions to projects
            for app, projects in appProjects.items():
                for project in projects:
                    project.removePermissionsToViewers(users_id)

    def add_permissions_to_editor_user_groups(self, groups_id):
        """
        Give guardian permissions to Editor user groups
        """

        appProjects = getProjectsByGroup(self)
        permissions = [
            'change_group',
            'delete_group',
            'view_group'
        ]

        for group_id in groups_id:
            setPermissionUserObject(AuthGroup.objects.get(pk=group_id), self, permissions=permissions)

            # adding permissions to projects

            for app, projects in appProjects.items():
                for project in projects:
                    if hasattr(project, 'add_permissions_to_editor_user_groups'):
                        project.add_permissions_to_editor_user_groups(groups_id)

    def remove_permissions_to_editor_user_groups(self, groups_id):
        """
        Remove guardian permissions to Editor user groups
        """
        appProjects = getProjectsByGroup(self)

        permissions = [
            'change_group',
            'delete_group',
            'view_group'
        ]

        for group_id in groups_id:
            setPermissionUserObject(AuthGroup.objects.get(pk=group_id), self, permissions=permissions,
                                    mode='remove')

            # adding permissions to projects
            for app, projects in appProjects.items():
                for project in projects:
                    if hasattr(project, 'remove_permissions_to_editor_user_groups'):
                        project.remove_permissions_to_editor_user_groups(groups_id)

    def add_permissions_to_viewer_user_groups(self, groups_id):
        """
        Give guardian permissions to Editor user groups
        """

        appProjects = getProjectsByGroup(self)
        permissions = [
            'view_group'
        ]

        for group_id in groups_id:
            setPermissionUserObject(AuthGroup.objects.get(pk=group_id), self, permissions=permissions)

            # adding permissions to projects
            for app, projects in appProjects.items():
                for project in projects:
                    if hasattr(project, 'add_permissions_to_viewer_user_groups'):
                        project.add_permissions_to_viewer_user_groups(groups_id)

    def remove_permissions_to_viewer_user_groups(self, groups_id):
        """
        Remove guardian permissions to Editor user groups
        """
        appProjects = getProjectsByGroup(self)

        permissions = [
            'view_group'
        ]

        for group_id in groups_id:
            setPermissionUserObject(AuthGroup.objects.get(pk=group_id), self, permissions=permissions,
                                    mode='remove')

            # removing permissions to projects
            for app, projects in appProjects.items():
                for project in projects:
                    if hasattr(project, 'remove_permissions_to_viewer_user_groups'):
                        project.remove_permissions_to_viewer_user_groups(groups_id)


    def __getattr__(self, attr):
        if attr == 'viewers':
            return get_users_for_object(self, 'view_group', [G3W_VIEWER1, G3W_VIEWER2], with_anonymous=True)
        elif attr == 'editor':
            editors = get_users_for_object(self, 'change_group', [G3W_EDITOR2, G3W_EDITOR1])
            if len(editors) > 0:
                return editors[0]
        return super(Group, self).__getattr__(attr)


class GroupProjectPanoramic(models.Model):

    group = models.ForeignKey(Group, models.CASCADE, related_name='project_panoramic', verbose_name=_('Group'))
    project_type = models.CharField(verbose_name=_('Project type'), max_length=255)
    project_id = models.IntegerField(verbose_name=_('Project type id'))


class GeneralSuiteData(models.Model):
    """
    Model for general data, to use on frontend
    """
    title = models.CharField(_('Title'), max_length=255)
    sub_title = models.CharField(_('Subtitle'), max_length=255, null=True, blank=True)
    home_description = models.TextField(_('Home description'), null=True, blank=True)
    about_title = models.CharField(_('About title'), max_length=255)
    about_description = models.TextField(_('About description'), null=True, blank=True)
    about_name = models.CharField(_('About name'), max_length=255)
    about_tel = models.CharField(_('About phone'), max_length=255, null=True, blank=True)
    about_email = models.EmailField(_('About email'), null=True, blank=True)
    about_address = models.CharField(_('About address'), max_length=255, null=True, blank=True)
    groups_title = models.CharField(_('Groups title'), max_length=255)
    groups_map_description = models.TextField(_('Groups map description'), null=True, blank=True)
    login_description = models.TextField(_('Login description'), null=True, blank=True)
    suite_logo = models.ImageField(_('Suite logo'), null=True, blank=True)
    url_suite_logo = models.URLField(_('Suite logo URL'), null=True, blank=True)

    # custom credits
    credits = models.TextField(_('Credits'), null=True, blank=True)

    # data fro map client
    main_map_title = models.CharField(_('Main map title'), max_length=400, null=True, blank=True)

    facebook_url = models.URLField(_('Facebook link'), null=True, blank=True)
    twitter_url = models.URLField(_('Twitter link'), null=True, blank=True)
    googleplus_url = models.URLField(_('Google+ link'), null=True, blank=True)
    youtube_url = models.URLField(_('Youtube link'), null=True, blank=True)
    instagram_url = models.URLField(_('Instagram link'), null=True, blank=True)
    flickr_url = models.URLField(_('Flickr link'), null=True, blank=True)
    tripadvisor_url = models.URLField(_('Tripadvisor link'), null=True, blank=True)


