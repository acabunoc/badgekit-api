var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql("ALTER TABLE `badgeInstances` "
          + "  ADD `authorName` VARCHAR(255) "
          , callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE `badgeInstances` "
          + "  DROP COLUMN `authorName` "
          , callback);
};
