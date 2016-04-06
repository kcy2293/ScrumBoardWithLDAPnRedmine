var async = require('async');
var Redmine = require('promised-redmine');

var redmine_admin;

var redmineController = function(config) {
  redmine_admin = config;
  this.host = config.host;
};

redmineController.prototype = {
  getUserRedmine : function(loginId, callback) {
	redmine_admin.getUsers()
	  .success(function(results) {
		var founded = false;
		var users = results.users;
		for (var i=0, len=users.length ; i < len ; i++) {
		  if (users[i].login == loginId) {
			founded = true;
			callback(null, {id:users[i].id, name:users[i].firstname});
		  }
		}
		if (!founded) {
		  callback("Not Found Id", null);
		}
	  });
  },
  getUserKey: function(id, callback) {
	redmine_admin.getUser(id).success(function(results) {
	  callback(results.user.api_key);
	});
  },
  getProjects: function(key, callback) {
	new Redmine({
	  host: this.host,
	  apiKey: key
	}).getProjects()
	  .success(function(results) {
		callback(null, results);
	  })
	  .error(function(err) {
		console.error('getProjects error : ' + err);
	  });
  },
  getIssues: function(pj_id, callback) {
	redmine_admin.getIssues({"project_id": pj_id})
	  .success(function(results) {
		callback(null, results);
	  })
	  .error(function(err) {
		console.error('getIssues error : ' + err);
	  });
  },
  getMemberShips: function(pj_id, callback) {
	redmine_admin.get('projects/'+pj_id+'/memberships')
	  .success(function(results) {
		callback(null, results);
	  })
	  .error(function(err) {
		console.error('getMemberShips : ' + err);
	  });
  }
};

module.exports = redmineController;
