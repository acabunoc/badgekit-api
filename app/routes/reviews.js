const safeExtend = require('../lib/safe-extend')
const Reviews = require('../models/review');

const errorHelper = require('../lib/error-helper')
const middleware = require('../lib/middleware')
const hashString = require('../lib/hash-string')

const dbErrorHandler = errorHelper.makeDbHandler('application')

exports = module.exports = function applyReviewRoutes (server) {
  server.get('/systems/:systemSlug/badges/:badgeSlug/applications/:applicationSlug/reviews', [
    middleware.findSystem(),
    middleware.findBadge({where: {systemId: ['system', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    showAllReviews,
  ]);
  server.get('/systems/:systemSlug/issuers/:issuerSlug/badges/:badgeSlug/applications/:applicationSlug/reviews', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findBadge({where: {issuerId: ['issuer', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    showAllReviews,
  ]);
  server.get('/systems/:systemSlug/issuers/:issuerSlug/programs/:programSlug/badges/:badgeSlug/applications/:applicationSlug/reviews', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findProgram({where: {issuerId: ['issuer', 'id']}}),
    middleware.findBadge({where: {programId: ['program', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    showAllReviews,
  ]);
  function showAllReviews (req, res, next) {
    var query = { badgeId : req.badge.id };
    var options = {relationships: true};

    Reviews.get(query, options, function foundRows (error, rows) {
      if (error)
        return dbErrorHandler(error, null, res, next);

      res.send({reviews: rows.map(reviewFromDb)});
      return next();
    });
  }

  server.get('/systems/:systemSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findBadge({where: {systemId: ['system', 'id']}}),
    middleware.findApplication({relationships: true, where: {badgeId: ['badge', 'id']}}),
    showOneApplication,
  ]);
  server.get('/systems/:systemSlug/issuers/:issuerSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findBadge({where: {issuerId: ['issuer', 'id']}}),
    middleware.findApplication({relationships: true, where: {badgeId: ['badge', 'id']}}),
    showOneApplication,
  ]);
  server.get('/systems/:systemSlug/issuers/:issuerSlug/programs/:programSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findProgram({where: {issuerId: ['issuer', 'id']}}),
    middleware.findBadge({where: {programId: ['program', 'id']}}),
    middleware.findApplication({relationships: true, where: {badgeId: ['badge', 'id']}}),
    showOneApplication,
  ]);
  function showOneApplication (req, res, next) {
    res.send({application: applicationFromDb(req.application)});
    return next();
  }

  server.post('/systems/:systemSlug/badges/:badgeSlug/applications', [
    middleware.findSystem(),
    middleware.findBadge({where: {systemId: ['system', 'id']}}),
    createApplication,
  ]);
  server.post('/systems/:systemSlug/issuers/:issuerSlug/badges/:badgeSlug/applications', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findBadge({where: {issuerId: ['issuer', 'id']}}),
    createApplication,
  ]);
  server.post('/systems/:systemSlug/issuers/:issuerSlug/programs/:programSlug/badges/:badgeSlug/applications', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findProgram({where: {issuerId: ['issuer', 'id']}}),
    middleware.findBadge({where: {programId: ['program', 'id']}}),
    createApplication,
  ]);
  function createApplication (req, res, next) {
    const evidence = req.body.criteria || [];
    const row = fromPostToRow(req.body);

    if (req.system) row.systemId = req.system.id
    if (req.issuer) row.issuerId = req.issuer.id
    if (req.program) row.programId = req.program.id
    if (req.badge) row.badgeId = req.badge.id

    row.slug = hashString(Date.now().toString() + row.learner),

    putApplication(row, evidence, function (err, application) {
      if (err) {
        if (!Array.isArray(err))
          return dbErrorHandler(err, row, res, next);
        return res.send(400, errorHelper.validation(err));
      }

      return res.send(201, {
        status: 'created',
        application: applicationFromDb(application)
      });
    });
  }

  server.put('/systems/:systemSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findBadge({where: {systemId: ['system', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    updateApplication,
  ]);
  server.put('/systems/:systemSlug/issuers/:issuerSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findBadge({where: {issuerId: ['issuer', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    updateApplication,
  ]);
  server.put('/systems/:systemSlug/issuers/:issuerSlug/programs/:programSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findProgram({where: {issuerId: ['issuer', 'id']}}),
    middleware.findBadge({where: {programId: ['program', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    updateApplication,
  ]);
  function updateApplication (req, res, next) {
    const row = safeExtend(req.application, req.body);
    const evidence = req.body.evidence;

    delete row.created;

    putApplication(row, evidence, function (err, application) {
      if (err) {
        if (!Array.isArray(err))
          return dbErrorHandler(err, row, res, next);
        return res.send(400, errorHelper.validation(err));
      }

      res.send({
        status: 'updated',
        application: applicationFromDb(application)
      });
    });
  }

  server.del('/systems/:systemSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findBadge({where: {systemId: ['system', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    deleteApplication,
  ]);
  server.del('/systems/:systemSlug/issuers/:issuerSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findBadge({where: {issuerId: ['issuer', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    deleteApplication,
  ]);
  server.del('/systems/:systemSlug/issuers/:issuerSlug/programs/:programSlug/badges/:badgeSlug/applications/:applicationSlug', [
    middleware.findSystem(),
    middleware.findIssuer({where: {systemId: ['system', 'id']}}),
    middleware.findProgram({where: {issuerId: ['issuer', 'id']}}),
    middleware.findBadge({where: {programId: ['program', 'id']}}),
    middleware.findApplication({where: {badgeId: ['badge', 'id']}}),
    deleteApplication,
  ]);
  function deleteApplication (req, res, next) {
    const row = req.application;
    Applications.del({id: row.id}, function (err, result) {
      if (err)
        return dbErrorHandler(err, row, req, next);

      res.send({
        status: 'deleted',
        application: applicationFromDb(row)
      });
    });
  }
};

function putApplication (row, evidence, callback) {
  var validationErrors = Applications.validateRow(row);
  if (validationErrors.length) {
    callback(validationErrors);
  }

  Applications.put(row, function(err, result) {
    if (err)
      return callback(err);

    const rowId = result.insertId || result.row.id;

    if (typeof evidence == 'undefined') {
      Applications.getOne({id: rowId}, {relationships: true}, callback);
    }
    else {
      Applications.getOne({id: rowId}, function(err, row) {
        if (err)
          return callback(err);

        return row.setEvidence(evidence, callback);
      });
    }
  });
};

function fromPostToRow (post) {
  return {
    author: post.author,
    comment: post.comment
  };
}

function reviewFromDb (row) {
  return {
    id: row.id,
    slug: row.slug,
    author: row.author,
    comment: row.comment,
    reviewItems: (row.reviewItems || []).map(function(reviewItem) {
      return {
        criterionId: reviewItem.criterionId,
        satisfied: reviewItem.satisfied,
        comment: reviewItem.comment
      }
    })
  };
}
