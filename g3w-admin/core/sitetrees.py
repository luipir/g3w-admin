from sitetree.utils import item
from .utils.tree import G3Wtree

# Be sure you defined `sitetrees` in your module.
sitetrees = (
  # Define a tree with `tree` function.
    G3Wtree('core', title='Menu', module='core', items=[
        # Then define items and their children with `item` function.
        item('MENU', '#', type_header=True),
        item('Scrivania', 'home', url_as_pattern=True, icon_css_class='fa fa-dashboard'),
        item('Gruppi cartografici', 'group-list', icon_css_class='fa fa-globe', children=[
            item('Aggiungi gruppo', 'group-add', url_as_pattern=True, icon_css_class='fa fa-plus',
                 access_by_perms=['core.add_group']),
            item('Lista gruppi', 'group-list', url_as_pattern=True, icon_css_class='fa fa-globe', alias='group-list',
                 in_breadcrumbs=True),
            item('Agg. gruppo {{ object.title}}', 'group-update object.slug', url_as_pattern=True,
                 icon_css_class='fa fa-edit', in_menu=False, alias='group-update'),
            item('Lista progetti {{ group.name }}', 'project-list group.slug', url_as_pattern=True,
                 icon_css_class='fa fa-list', in_menu=False, in_breadcrumbs=True, alias='project-list'),
        ]),
        item('Macro Gruppi cartografici', 'macrogroup-list', access_by_perms=['core.add_macrogroup'],
             icon_css_class='fa fa-globe', children=[
            item('Aggiungi MACRO gruppo', 'macrogroup-add', url_as_pattern=True, icon_css_class='fa fa-plus',
                 access_by_perms=['core.add_macrogroup']),
            item('Lista MACRO gruppi', 'macrogroup-list', url_as_pattern=True, icon_css_class='fa fa-globe',
                 alias='macrogroup-list', in_breadcrumbs=True),
        ]),
    ]),

    G3Wtree('core_en', title='Menu', module='core', items=[
      # Then define items and their children with `item` function.
      item('MENU', '#', type_header=True),
      item('Dashboard', 'home', url_as_pattern=True, icon_css_class='fa fa-dashboard'),
      item('Cartographic groups', 'group-list', icon_css_class='fa fa-globe', children=[
          item('Add group', 'group-add', url_as_pattern=True, icon_css_class='fa fa-plus', access_by_perms=['core.add_group']),
          item('Groups list', 'group-list', url_as_pattern=True, icon_css_class='fa fa-globe', alias='group-list', in_breadcrumbs=False),
          item('Groups update {{ object.title}}', 'group-update object.slug', url_as_pattern=True, icon_css_class='fa fa-edit', in_menu=False, alias='group-update'),
          item('Projects list {{ group.name }}', 'project-list group.slug', url_as_pattern=True, icon_css_class='fa fa-list', in_menu=False, alias='project-list')
      ]),
    ])
)
