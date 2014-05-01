

exports.testfunc1 = function testfunc1() {
  console.log('called testfunc1');
  var res = exports.testfunc2();
  return res;
}

exports.testfunc2 = function testfunc1() {
  console.log('called testfunc2');
  return 5;
}