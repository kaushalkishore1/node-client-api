/*
 * Copyright 2014-2015 MarkLogic Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var should = require('should');

var testconfig = require('../etc/test-config-qa.js');

var marklogic = require('../');
var q = marklogic.queryBuilder;

var db = marklogic.createDatabaseClient(testconfig.restReaderConnection);
var dbWriter = marklogic.createDatabaseClient(testconfig.restWriterConnection);
var dbAdmin = marklogic.createDatabaseClient(testconfig.restAdminConnection);

describe('Document facet query test', function(){
  before(function(done){
    this.timeout(3000);
    dbWriter.documents.write({
      uri: '/test/query/facet/doc1.json',
      collections: ['facetCollection'],
      contentType: 'application/json',
      content: {
        title: 'Vannevar Bush',
        popularity: 5,
        id: '0011',
        date: '2005-01-01T01:02:55',
        price: {
             amt: 0.1
           },
        p: 'Vannevar Bush wrote an article for The Atlantic Monthly'
        }
      }, { 
      uri: '/test/query/facet/doc2.json',
      collections: ['facetCollection'],
      contentType: 'application/json',
      content: {
        title: 'The Bush article',
        popularity: 4,
        id: '0012',
        date: '2006-02-02T14:33:34',
        price: {
             amt: 0.12
           },
        p: 'The Bush article described a device called a Memex'
        }
      }, { 
      uri: '/test/query/facet/doc3.json',
      collections: ['facetCollection'],
      contentType: 'application/json',
      content: {
        title: 'For 1945',
        popularity: 3,
        id: '0013',
        date: '2007-03-03T23:12:44',
        price: {
             amt: 1.23
           },
        p: 'For 1945, the thoughts expressed in the Atlantic Monthly were groundbreaking'
        }
      }, { 
      uri: '/test/query/facet/doc4.json',
      collections: ['facetCollection'],
      contentType: 'application/json',
      content: {
        title: 'Vannevar served',
        popularity: 5,
        id: '0024',
        date: '2008-04-04T10:00:23',
        price: {
             amt: 12.34
           },
        p: 'Vannevar served as a prominent policymaker and public intellectual'
        }
      }, { 
        uri: '/test/query/facet/doc5.json',
        collections: ['facetCollection'],
        contentType: 'application/json',
        content: {
          title: 'The memex',
          popularity: 5,
          id: '0026',
          date: '2009-05-05T20:55:12',
          price: {
               amt: 123.45
             },
          p: 'The Memex, unfortunately, had no automated search feature'
          }
        }).
    result(function(response){done();}, done);
  });

  it('should query with facet', function(done){
    db.documents.query(
      q.where(
        q.directory('/test/query/facet/')
      ).
      calculate(
        q.facet('popularity', q.facetOptions('item-frequency'))
      ).
      slice(0)
    ).
    result(function(response) {
      //console.log(JSON.stringify(response, null, 2));
      response.facets.popularity.facetValues.length.should.equal(3);  
      response.facets.popularity.facetValues[0].name.should.equal('3');  
      done();
    }, done);
  });

  it('should query with descending facet', function(done){
    db.documents.query(
      q.where(
        q.collection('facetCollection')
      ).
      calculate(
        q.facet('popularity', q.facetOptions('item-frequency', 'descending'))
      ).
      slice(0)
    ).
    result(function(response) {
      //console.log(JSON.stringify(response, null, 2));
      response.facets.popularity.facetValues.length.should.equal(3);  
      response.facets.popularity.facetValues[0].name.should.equal('5');  
      done();
    }, done);
  });

  it('should query with absolute bucket', function(done){
    db.documents.query(
      q.where(
        q.directory('/test/query/facet/')
      ).
      calculate(
        q.facet(
          'popularity',
          q.datatype('int'),
          q.bucket('low', '<', 2),
          q.bucket('moderate', 2, '<', 4),
          q.bucket('high', 4, '<')
        )
      )
    ).
    result(function(response) {
      //console.log(JSON.stringify(response, null, 2));
      response[0].facets.popularity.facetValues[0].name.should.equal('moderate'); 
      response[0].facets.popularity.facetValues[0].count.should.equal(1); 
      done();
    }, done);
  });

  /*it('should query with absolute bucket on dateTime', function(done){
    db.documents.query(
      q.where(
        q.directory('/test/query/facet/')
      ).
      calculate(
        q.facet(
          'date',
          q.datatype('dateTime'),
          q.bucket('2005', '2005-01-01T00:00:00', '<', '2006-01-01T00:00:00'),
          q.bucket('2006', '2006-01-01T00:00:00', '<', '2007-01-01T00:00:00'),
          q.bucket('2007', '2007-01-01T00:00:00', '<', '2008-01-01T00:00:00'),
          q.bucket('2008', '2008-01-01T00:00:00', '<', '2009-01-01T00:00:00'),
          q.bucket('2009', '2009-01-01T00:00:00', '<', '2010-01-01T00:00:00')
        )
      )
    ).
    result(function(response) {
      console.log(JSON.stringify(response, null, 2));
      //response[0].facets.popularity.facetValues[0].name.should.equal('moderate'); 
      //response[0].facets.popularity.facetValues[0].count.should.equal(1); 
      done();
    }, done);
  });*/

  it('should remove the documents', function(done){
    dbAdmin.documents.removeAll({collection: 'facetCollection'}).
    result(function(response) {
      done();
    }, done);
  });

});
