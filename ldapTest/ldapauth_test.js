var ldapAuth = require('ldapauth');

var LDAP_URL = 'ldap://mail.ust21.co.kr:389'
//var LDAP_URL = 'ldap://mail.ust21.co.kr'
var LDAP_BASE = 'ou=people,dc=ust21,dc=co,dc=kr';

var ldap = new ldapAuth({
  	url: LDAP_URL,
	adminDn: 'uid=admin,ou=people,dc=ust21,dc=co,dc=kr',
	adminPassword: '8898865i',
	searchBase: LDAP_BASE,
	searchFilter: "(uid={{username}})"
});

ldap.authenticate('thinktop', 'zero00', function(err, user) {
  if (err) {
	console.error('LDAP auth error : ' + err);
  } else {
	console.log('success');
	console.log(user);
  }
});
