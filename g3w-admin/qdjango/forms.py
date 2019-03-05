from django import forms
from django.forms import ValidationError, widgets
from django.db.models import Q
from django.core.files.base import ContentFile
from django.utils.translation import ugettext, ugettext_lazy as _
from crispy_forms.helper import FormHelper, Layout
from crispy_forms.layout import Div, Field, HTML
from core.mixins.forms import *
from core.utils.forms import crispyBoxBaseLayer
from usersmanage.forms import G3WACLForm
from django_file_form.forms import FileFormMixin, UploadedFileField
from .models import *
from usersmanage.utils import get_fields_by_user, crispyBoxACL, userHasGroups
from .utils.data import QgisProject
from .utils.validators import ProjectExists
import zipfile
import re


class QdjangoProjectFormMixin(object):
    """
    Mixin for project qdjango form, clean policy ofr qgisfile
    """
    def clean_qgis_file(self):
        try:
            qgis_file = self.cleaned_data['qgis_file']

            # validate extension
            file_extension = os.path.splitext(qgis_file.name)[1]
            if file_extension.lower() not in ('.qgs', '.qgz'):
                raise Exception(_("File must have 'qgs' or 'qgz' extension"))

            # for QGIS qgz file format
            if file_extension.lower() == '.qgz':
                zfile = zipfile.ZipFile(qgis_file, 'r')
                for fileinfo in zfile.infolist():
                    if os.path.splitext(fileinfo.filename)[1].lower() == '.qgs':
                        qzfile = fileinfo.filename

                # put qzfile to qgis_file
                qgis_file = ContentFile(zfile.open(qzfile, 'r').read(), name=qzfile)

            kwargs = {'group': self.group}
            if self.instance.pk:
                kwargs['instance'] = self.instance
            self.qgisProject = QgisProject(qgis_file, **kwargs)
            if not self.instance.pk:
                self.qgisProject.registerValidator(ProjectExists)
            self.qgisProject.clean()
        except Exception as e:
            raise ValidationError(str(e))
        return qgis_file

    def clean_url_alias(self):
        url_alias = self.cleaned_data['url_alias']

        if url_alias:
            regex = re.compile(r'[\w-]+$')
            if not regex.match(url_alias):
                raise ValidationError(_("Url alias can contains only numbers, letters, - or _"))

            # check for unique
            if ProjectMapUrlAlias.objects.filter(alias=url_alias).exclude(app_name='qdjango', project_id=self.instance.pk).exists():
                raise ValidationError(_("This alias is used by another project/map"))
        return url_alias

    def _save_url_alias(self):
        """
        Save url_alias if is set
        :return:
        """
        self.instance.url_alias = self.cleaned_data['url_alias']



class QdjangoProjetForm(QdjangoProjectFormMixin, G3WFormMixin, G3WGroupFormMixin, G3WGroupBaseLayerFormMixin,
                        G3WRequestFormMixin, G3WACLForm, FileFormMixin, forms.ModelForm):

    qgis_file = UploadedFileField(required=True)
    thumbnail = UploadedFileField(required=False)
    url_alias = forms.CharField(
        required=False,
        label=_('URL alias'),
        help_text=_('You can set a human readable URL for the map. Only alphanumeric characters, not white space or '
                    'special characters')
    )

    def __init__(self, *args, **kwargs):
        if 'instance' in kwargs:
            kwargs['initial']['url_alias'] = kwargs['instance'].url_alias

        super(QdjangoProjetForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.layout = Layout(
                            Div(
                                Div(
                                    Div(
                                        Div(
                                            HTML("<h3 class='box-title'><i class='ion ion-map'></i> {}</h3>"
                                                 .format(_('Qgis Project'))),
                                            css_class='box-header with-border'
                                        ),
                                        Div(
                                            'qgis_file',
                                            'form_id',
                                            'upload_url',
                                            'delete_url',
                                            css_class='box-body',

                                        ),
                                        css_class='box box-success'
                                    ),
                                    css_class='col-md-6'
                                ),

                                crispyBoxACL(self),
                                crispyBoxBaseLayer(self),

                                Div(
                                    Div(
                                        Div(
                                            HTML("<h3 class='box-title'><i class='fa fa-file'></i> {}</h3>"
                                                 .format(_('Descrition data'))),
                                            css_class='box-header with-border'
                                        ),
                                        Div(
                                            Field('description', css_class='wys5'),
                                            'thumbnail',
                                            HTML("""<img
                                            {% if not form.thumbnail.value %}style="display:none;"{% endif %}
                                            class="img-responsive img-thumbnail"
                                            src="{{ MEDIA_URL }}{{ form.thumbnail.value }}">""", ),
                                            'url_alias',
                                            css_class='box-body',
                                        ),
                                        css_class='box box-success'
                                    ),
                                    css_class='col-md-12'
                                ),


                                css_class='row'
                            )
        )

    class Meta:
        model = Project
        fields = (
            'qgis_file',
            'description',
            'thumbnail',
            'baselayer'
        )

        widgets = {
            '''
            'qgis_file': DropzoneInput(dropzone_config={
                'url': '/file-upload/',
                'maxFiles':1}
            )
            '''
        }

    def save(self, commit=True):
        self._ACLPolicy()

        self._save_url_alias()

        # add permission to editor1 if current user is editor1
        if userHasGroups(self.request.user, [G3W_EDITOR1, G3W_EDITOR2]):
            self.instance.addPermissionsToEditor(self.request.user)


class QdjangoWidgetForm(QdjangoProjectFormMixin, G3WFormMixin, G3WGroupFormMixin, G3WRequestFormMixin, forms.ModelForm):
    """
    Form object for Qdjango widget model.
    """

    def __init__(self, *args, **kwargs):
        super(QdjangoWidgetForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.layout = Layout(
            Div(
                Div(
                    'widget_type',
                    css_class='col-md-4'
                ),
                Div(
                    'name',
                    css_class='col-md-8'
                ),
                css_class='row'
            ),
            'body'
        )


    class Meta:
        model = Widget
        fields = (
            'widget_type',
            'name',
            'body'
        )
        widgets = {
            'body': widgets.HiddenInput
        }

