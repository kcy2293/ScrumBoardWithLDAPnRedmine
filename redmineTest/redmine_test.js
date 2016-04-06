var Redmine = require('promised-redmine');
var async = require('async');

var config = {
  //host: "redmine.ust21.co.kr",
  host: "192.168.0.193",
  apiKey: "0c0329fc7c806d4634cc7cee9d3da646d5d5f19a",
  protocol: "http"
  //basicAuth: "thinktop:zero00"
};

var redmine = new Redmine(config);

/* 레드마인 연결 성공 여부 파악 - 모든 프로젝트 가져오기 모듈 */
/*
redmine.getProjects().success(function(projects) {
  console.log(projects);
});
*/

/* 이슈 ID 를 통한 일감 정보 가져오기 모듈 */
/*
redmine.getIssue(131).success(function(data) {
  console.log(data);
});
*/

/* 모든 유저정보 가져오기 */
/*
redmine.getUsers().success(function(results) {
  console.log(results);
});
*/

/* 개별 유저정보 가져오기 */
/*
redmine.get('users/16', {'include': 'memberships'}).success(function(results) {
  console.log(results);
  console.log(results.user.memberships);
});
*/

/*
redmine.getUser(10).success(function(results) {
  console.log(results);
});
*/

/* 프로젝트 멤버쉽 정보 가져오기 */
redmine.get('projects/ust21_labs_2014/memberships').success(function(results) {
//redmine.get('projects/scrumblr_sync_redmine/memberships').success(function(results) {
  console.log(results);

  console.log(results.memberships.length);
  var memberships = results.memberships;
  for (var i = 0 , len = memberships.length ; i < len ; i++) {
	//console.log(memberships);
	console.log(memberships[i].user);
	console.log(memberships[i].roles);
  }
});

/* 프로젝트 ID 를 통한 모든 일감 가져오기 모듈 */
/*
redmine.getIssues({project_id:41}).success(function(issues) {
  console.log(issues);
  //console.log(issues.total_count);
  for (var i = 0 , len = issues.total_count ; i < len ; i++) {
	console.log(issues.issues[i].subject);
	console.log(issues.issues[i].status);
  }
});
*/

/* 이슈 업데이트를 위한 테스트 모듈 */
/*
async.series([
	function(callback) {
	  console.log('----- issue_statuses -----');
	  redmine.get('issue_statuses').success(function(status) {
		console.log(status);
		console.log();
		callback(null);
	  });
	},
	function(callback) {
	  console.log('----- getIssues : 41 -----');
	  redmine.getIssues({project_id:41}).
		success(function(issues) {
		  //console.log(issues);
		  //console.log(issues.total_count);
		  for (var i = 0 , len = issues.total_count ; i < len ; i++) {
			console.log(issues.issues[i].id);
			console.log(issues.issues[i].subject);
			console.log(issues.issues[i].status);
		  }

		  callback(null);
		});
	},
	function(callback) {
	  console.log('----- issue status update -----');
	  redmine.updateIssue(157, {status_id: 1, done_ratio: 100})
		.success(function(result) {
		  console.log(result);
		  callback(null);
		});
	},
	function(callback) {
	  console.log('----- getIssues : 41 -----');
	  redmine.getIssues({project_id:41}).
		success(function(issues) {
		  //console.log(issues);
		  //console.log(issues.total_count);
		  for (var i = 0 , len = issues.total_count ; i < len ; i++) {
			console.log(issues.issues[i].subject);
			console.log(issues.issues[i].status);
		  }

		  callback(null);
		});
	}
], function (err, result) {
});
*/


