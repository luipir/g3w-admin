# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-10-02 13:26


from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0049_macrogroup_use_title_logo_client'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='macrogroup',
            options={'permissions': (('view_macrogroup', 'Can view macro group maps'),)},
        ),
    ]
