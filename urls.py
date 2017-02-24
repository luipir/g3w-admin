from django.conf.urls import url
from django.contrib.auth.decorators import login_required
from .views import *

urlpatterns = [
    url(r'^config/$', login_required(CduConfigList.as_view()), name='cdu-config-list'),
    url(r'config/add/$', login_required(CduConfigWizardView.as_view()), name='cdu-config-add'),
    url(r'config/detail/(?P<slug>[-_\w\d]+)/$', login_required(CduConfigDetailView.as_view()),
        name='cdu-config-detail'),
    url(r'config/update/(?P<slug>[-_\w\d]+)/$', login_required(CduConfigWizardView.as_view()),
        name='cdu-config-update'),
    url(r'config/delete/(?P<slug>[-_\w\d]+)/$', login_required(CduConfigDeleteView.as_view()),
        name='cdu-config-delete'),

    # create odt file
    url(r'createdoc/(?P<id>[0-9]+)/$', login_required(CduCreatedocView.as_view()),
        name='cdu-config-createdoc'),
]