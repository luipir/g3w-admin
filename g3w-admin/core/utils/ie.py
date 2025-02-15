from import_export.resources import ModelResource, ModelDeclarativeMetaclass


def modelresource_factory(model, resource_class=ModelResource, **kwargs):
    """
    Factory for creating ``ModelResource`` class for given Django model.
    """
    attrs = {'model': model}
    attrs.update(kwargs)
    Meta = type(str('Meta'), (object,), attrs)

    class_name = model.__name__ + str('Resource')

    class_attrs = {
        'Meta': Meta,
    }

    metaclass = ModelDeclarativeMetaclass
    return metaclass(class_name, (resource_class,), class_attrs)