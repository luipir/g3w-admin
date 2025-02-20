from __future__ import unicode_literals
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User, Group
from django.db import models
from core.utils.models import G3WChoices
from .configs import USER_BACKEND_DEFAULT


class Department(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Userdata(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.OneToOneField(Department, null=True, blank=True)
    avatar = models.ImageField(_('Avatar'), upload_to='user_avatar', null=True, blank=True)


USER_BACKEND_TYPES = G3WChoices(
        (USER_BACKEND_DEFAULT, 'G3WSUITE'),
    )


class Userbackend(models.Model):
    """
    backend authentication's user
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    backend = models.CharField('Backend', choices=USER_BACKEND_TYPES, max_length=255, default=USER_BACKEND_DEFAULT)
    options = models.TextField('Options', null=True, blank=True)

    def __str__(self):
        return self.backend


GROUP_ROLES = G3WChoices(
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
    )


class GroupRole(models.Model):
    """
    Model to add main user group role
    """
    group = models.OneToOneField(Group, on_delete=models.CASCADE)
    role = models.CharField(_('Group role'), max_length=100, choices=GROUP_ROLES)
