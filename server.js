/*************************
 * SYSTEM INCLUDES
 *************************/
var express = require('express');
var session = require('express-session');
var path = require('path');
var http = require('http');
var ldapAuth = require('ldapauth');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Redmine = require('promised-redmine');
var async = require('async');
var favicon = require('serve-favicon');
var	data	= require('./lib/data.js').db;
var redmineController = require('./lib/redmineController.js');

/*************************
 * GLOBALS
 *************************/
var LDAP_ADMIN_DN = 'uid=admin,ou=people,dc=ust21,dc=co,dc=kr';
var LDAP_ADMIN_PW = '8898865i';
var LDAP_URL = 'ldap://mail.ust21.co.kr:389';
var LDAP_BASE = 'ou=people,dc=ust21,dc=co,dc=kr';
var SESSION_KEY = 'ust21_scrumblr';
var session_info = {
  //'store': new express.session.MemoryStore(),
  'saveUninitialized': true,
  'resave': false,
  'secret': '8898865',
  'key': SESSION_KEY
};
var REDMINE_HOST = '192.168.0.193';
var REDMINE_APIKEY = '0c0329fc7c806d4634cc7cee9d3da646d5d5f19a';

/*************************
 * SETUP EXPRESS
 *************************/
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/scrum_favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('test'));
app.use(session(session_info));
app.use(express.static(path.join(__dirname, 'lib')));
app.use(express.static(path.join(__dirname, 'public')));

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.Server(app);
var port = process.argv[2] || 3100;
server.listen(port, function() {
  console.log('Server running at http://127.0.0.1:'+ port + '/');
});
/*************************
 * SETUP SOCKET.IO
 *************************/
var io = require('socket.io')(server);
var svrSocket = require('./lib/svrSocket.js');
svrSocket.init(io);

/********************************
 * SETUP REDIS DB (scrumblr db)
 ********************************/
var db = new data(function() {});

/*************************
 * SETUP REDMINE REST API
 *************************/
var redmine = new Redmine({
	host: REDMINE_HOST,
	apiKey: REDMINE_APIKEY
});
svrSocket.setRedmine(redmine);
var rControls = new redmineController(redmine);

/*************************
 * ROUTES
 *************************/
app.get('/', loginRequired, function(req, res) {

  rControls.getProjects(req.session.redmineKey, function(err, results) {
	var url = req.header('host');
	var connected = io.sockets.connected;
	clientsCount = Object.keys(connected).length;

	res.render('home', {
	  url: url,
	  connected: clientsCount,
	  projects: results.projects
	});
  });
});

app.get('/login', function(req, res) {
  var remember = req.signedCookies.remember;
  var id = req.signedCookies.userid;
  var pw = req.signedCookies.userpw;
  res.render('login', {
	remember: remember,
	id: id,
	pw: pw
  });
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.clearCookie('userid');
  res.clearCookie('userpw');
  res.clearCookie('remember');
  //res.render('logout');
  return res.redirect('/');
});

app.post('/login', function(req, res) {
  var id = req.body.username;
  var pw = req.body.password;
  var remember = req.body.remember;

  var ldap = new ldapAuth({
	  url: LDAP_URL,
	  searchBase: LDAP_BASE,
	  searchFilter: "(uid={{username}})",
	  retry: 3,
	  adminDn: LDAP_ADMIN_DN,
	  adminPassword: LDAP_ADMIN_PW
  });

  ldap.authenticate(id, pw, function(err, success) {
	var isAdmin = false;
	if (id === 'admin' && pw === 'admin') {
	  isAdmin = true;
	  success = true;
	}

	if (err != null && !isAdmin) {
	  var errMsg = '' + err;
	  if ((errMsg.indexOf('ConnectionError')) != -1) {
		console.log('Ldap connection error.. retry...');
	  } else {
		console.error('Error in ldap authenticate : ' + err);
		res.render('login', {
		  error: 'login error'
		});
	  }
	}
	else if (id && pw && success) {
	  console.log('LDAP Login success : ' + id);
	  if (remember === 'true') {
		res.cookie('userid', id, { signed: true, httpOnly: true });
		res.cookie('userpw', pw, { signed: true, httpOnly: true });
		res.cookie('remember', remember, { signed: true, httpOnly: true });
	  } else {
		res.clearCookie('userid');
		res.clearCookie('userpw');
		res.clearCookie('remember');
	  }

	  req.session.username = id;

	  rControls.getUserRedmine(id, function(err, user) {
		if (err) {
		  console.error(err);
		  return res.redirect('back');
		} else {
		  req.session.redmineId = user.id;
		  var name = user.name;
		  var value = setCookie('scrumscrum-username',name, 365);
		  res.cookie(value);

		  rControls.getUserKey(user.id, function(key) {
			req.session.redmineKey = key;
			return res.redirect(req.query.next || '/');
		  });
		}
	  });
	} else {
	  return res.redirect('back');
	}
  });
});

app.get('/:id', loginRequired, function(req, res){
  async.waterfall([

	function(callback) {
	  rControls.getProjects(req.session.redmineKey, function(err, results) {
		callback(null, results.projects);
	  });
	},

	function(projects, callback) {
	  var pj_id = -1;
	  var req_id = req.params.id;
	  for (var i = 0, len = projects.length ; i < len ; i++) {
		if(projects[i].identifier === req_id){
		  pj_id = projects[i].id;
		}
	  }

	  if (pj_id != -1) {
		rControls.getIssues(pj_id, function(err, results) {
		  callback(null, pj_id, projects, results.issues);
		});
	  } else {
		console.log('fail to get project_id');
		return res.redirect('/');
		callback('err', pj_id, projects, null);
	  }
	},

	function(pj_id, projects, issues, callback) {
	  if(issues == null) {
		callback('err', pj_id, projects, null);
	  } else {
		db.getAllCards(req.path, function(cards) {
		  var addIssues = [];

		  for (var i = 0 , len1 = issues.length ; i < len1 ; i++) {
			var issueId = issues[i].id; 
			var subject = issues[i].subject; 
			var status = issues[i].status.name;
			var save = true;

			if (status == "해결") {
			  continue;
			}

			for (var j = 0 , len2 = cards.length ; j < len2 ; j++) {
			  if (("issue" + issueId) == cards[j].id) {
				save = false;
			  }
			}

			if (save) {
			  addIssues.push({issueId:issueId, subject:subject})
			}
		  }

		  callback(null, pj_id, projects, addIssues);
		});

	  }
	}, 
	function(pj_id, projects, addIssues, callback) {
	  if (pj_id === -1) {
		callback('err', pj_id, projects, null, null);
	  } else {
		rControls.getMemberShips(pj_id, function(err, results) {
		  var redmineId = req.session.redmineId;
		  var memberships = results.memberships;
		  var founded = false;

		  for (var i = 0 , len = memberships.length ; i < len ; i++) {
			if (memberships[i].user.id == redmineId) {
			  var roles = memberships[i].roles;
			  for (var j = 0, lenj = roles.length ; j < lenj ; j++) {
				if (roles[j].name == '관리자') {
				  founded = true;
				  callback(null, pj_id, projects, addIssues, founded);
				}
			  }
			}
		  }
		  if (!founded) {
			callback(null, pj_id, projects, addIssues, founded);
		  }
		});
	  }
	}
  ], function(err, pj_id, projects, addIssues, founded) {
	if (err) {
	  return res.redirect('/');
	} else {
	  res.render('board', {
		pageId: req.params.id,
		pj_id: pj_id,
		projects: projects,
	    addIssues: JSON.stringify(addIssues),
	    isManager: founded
	  });
	}
  });
});

/*************************
 * FUNCTIONS
 *************************/
function loginRequired(req, res, next) {
  if (req.session && req.session.username) {
	next();
  } else {
	res.redirect('login?next=' + req.url);
  }
}

function setCookie(c_name, value, exdays) {                
  var exdate = new Date();                               
  exdate.setDate(exdate.getDate() + exdays);             
  var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" +                                             
	  exdate.toUTCString());                             
  return c_name + "=" + c_value;
}

