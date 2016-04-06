var LDAP = require('LDAP');


var ldap = new LDAP({
  	uri: 'ldap://mail.ust21.co.kr'
});

var search_options = {
  binddn: 'thinktop',
  password: 'zero00',
  base: 'ou=people,dc=ust21,dc=co,dc=kr'
}

ldap.open(function(err) {
  if (err) {
	throw new Error('Can not connect to LDAP server');
  } else {
	ldap.search(search_options, function(err, data) {
	  if (err) {
		console.error('LDAP auth error [%s]', err);
	  } else {
		console.log(data);
		console.log('success');
	  }
	});
  }
});
