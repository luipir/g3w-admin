# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-08-23 11:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0027_auto_20160819_0949'),
    ]

    operations = [
        migrations.CreateModel(
            name='MapControl',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Map control',
                'verbose_name_plural': 'Map controls',
            },
        ),
        migrations.AddField(
            model_name='group',
            name='mapcontrols',
            field=models.ManyToManyField(null=True, to='core.MapControl'),
        ),
    ]
