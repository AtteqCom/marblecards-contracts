// Logger module

module.exports.log = function(msg) {
  
  if (process.env.LOG) {
    console.log(msg);
  }
};
