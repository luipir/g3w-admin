# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2016-03-21 15:21


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usersmanage', '0003_userdata_avatar'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userdata',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='user_avatar', verbose_name='Avatar'),
        ),
    ]
