# coding=utf-8
""""Tests for core module API

.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__ = 'elpaso@itopen.it'
__date__ = '2019-06-03'
__copyright__ = 'Copyright 2019, Gis3w'

import os
import json
from rest_framework.test import APITestCase, APIClient
from django.conf import settings
from django.urls import reverse
from django.test import override_settings
from django.contrib.auth.models import User
from qdjango.models import Project
from django.core.cache import caches
from qdjango.models import Layer

# Re-use test data from qdjango module
DATASOURCE_PATH = os.path.join(os.getcwd(), 'qdjango', 'tests', 'data')

@override_settings(MEDIA_ROOT=DATASOURCE_PATH)
@override_settings(DATASOURCE_PATH=DATASOURCE_PATH)
@override_settings(CACHES = {
    'qdjango': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'some',
    }
})
@override_settings(SPATIALITE_LIBRARY_PATH='mod_spatialite.so')
class CoreApiTest(APITestCase):
    """Test core API"""

    # These are stored in core module
    fixtures = [
        "BaseLayer.json",
        "G3WGeneralDataSuite.json",
        "G3WMapControls.json",
        "G3WSpatialRefSys.json",
        # except for this one which is in qdjango:
        "G3WSampleProjectAndGroup.json",
    ]

    @classmethod
    def setUpClass(cls):
        super(CoreApiTest, cls).setUpClass()
        try:
            cls.user = User.objects.get(username='admin%s' % cls.__class__)
        except:
            cls.user = User.objects.create_superuser(username='admin%s' % cls.__class__, password='admin', email='')

        # Fill the cache with getprojectsettings response so we don't need a QGIS instance running
        # TODO: eventually move to QgsServer
        prj = Project.objects.get(title='Un progetto')
        cache_key = settings.QDJANGO_PRJ_CACHE_KEY.format(prj.pk)
        cache = caches['qdjango']
        cache.set(cache_key, open(os.path.join(DATASOURCE_PATH, 'getProjectSettings_gruppo-1_un-progetto.xml')).read())

        # Fix datasource path for spatialite
        l = Layer.objects.get(name='spatialite_points')
        l.datasource = u'dbname=\'%s/un-progetto-data/un-progetto.db\' table="spatialite_points" (geom) sql=' % DATASOURCE_PATH
        l.save()

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()

    def setUp(self):
        self.client = APIClient()

    def tearDown(self):
        self.client.logout()

    def _d(self, d, path=[]):
        for k,v in d.items():
            _path = ( path if path else '') + "[\"%s\"]" % k
            if type(v) == dict:
                self._d(v, _path)
            else:
                if type(v) == list:
                    print("self.assertEqual(resp%s, %s)" % (_path, v))
                else:
                    print("self.assertEqual(resp%s, \"%s\")" % (_path, v))


    def __testApiCall(self, view_name, args):
        """Utility to make test calls"""

         # No auth
        response = self.client.get(reverse(view_name, args=args))
        self.assertEqual(response.status_code, 403)

        # Auth
        self.assertTrue(self.client.login(username=self.user.username, password='admin'))
        response = self.client.get(reverse(view_name, args=args))
        self.assertEqual(response.status_code, 200)
        self.client.logout()
        return response


    def testCoreVectorApi(self):
        """Test core-vector-api"""

        response = self.__testApiCall('core-vector-api', ['shp', 'qdjango', '1', 'spatialite_points20190604101052075'])
        self.assertTrue('spatialite_points.shp' in response.content)

        response = self.__testApiCall('core-vector-api', ['config', 'qdjango', '1', 'spatialite_points20190604101052075'])
        resp = json.loads(response.content)
        self.assertIsNone(resp["vector"]["count"])
        self.assertEqual(resp["vector"]["format"], "GeoJSON")
        self.assertEqual(resp["vector"]["fields"], [{u'name': u'pkuid', u'editable': False, u'label': u'pkuid', u'input': {u'type': u'text', u'options': {}}, u'validate': {}, u'type': u'integer'}, {u'name': u'name', u'editable': True, u'label': u'name', u'input': {u'type': u'textarea', u'options': {}}, u'validate': {}, u'type': u'text'}])
        self.assertEqual(resp["vector"]["geometrytype"], "Point")
        self.assertEqual(resp["vector"]["pk"], "pkuid")
        self.assertIsNone(resp["vector"]["data"])
        self.assertTrue(resp["result"])
        self.assertIsNone(resp["featurelocks"])

        response = self.__testApiCall('core-vector-api', ['data', 'qdjango', '1', 'spatialite_points20190604101052075'])
        resp = json.loads(response.content)
        self.assertIsNone(resp["vector"]["count"])
        self.assertEqual(resp["vector"]["format"], "GeoJSON")
        self.assertIsNone(resp["vector"]["fields"])
        self.assertEqual(resp["vector"]["geometrytype"], "Point")
        self.assertEqual(resp["vector"]["pk"], "pkuid")
        self.assertEqual(resp["vector"]["data"]["type"], "FeatureCollection")
        self.assertEqual(resp["vector"]["data"]["features"], [{u'geometry': {u'type': u'Point', u'coordinates': [1.980089, 28.779772]}, u'type': u'Feature', u'id': 1, u'properties': {u'name': u'a point'}}, {u'geometry': {u'type': u'Point', u'coordinates': [10.685247, 44.350968]}, u'type': u'Feature', u'id': 2, u'properties': {u'name': u'another point'}}])
        self.assertTrue(resp["result"])
        self.assertIsNone(resp["featurelocks"])

        response = self.__testApiCall('core-vector-api', ['xls', 'qdjango', '1', 'spatialite_points20190604101052075'])
        self.assertEqual(len(response.content), 5632)
