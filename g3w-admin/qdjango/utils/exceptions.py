from django.utils.translation import ugettext, ugettext_lazy as _


class QgisException(Exception):
    pre_error_msg = _('Qgis Exceptions errors')


class QgisProjectException(QgisException):

    pre_error_msg = _('Project error')

    def __unicode__(self):
        return u"[{}]-- {}".format(self.pre_error_msg, self.message)


class QgisProjectLayerException(QgisProjectException):

    pre_error_msg = _('Layer error')



