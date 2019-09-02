# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-09-26 09:48


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0048_generalsuitedata_main_map_title'),
    ]

    operations = [
        migrations.AddField(
            model_name='macrogroup',
            name='use_title_logo_client',
            field=models.BooleanField(default=False, verbose_name='Use title and logo for client'),
        ),
    ]
