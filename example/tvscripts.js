var path = require('path');
var predictive = require('../predictive');

var options = {
  files: [
    path.join(__dirname,"text/seinfeld.txt"),
    path.join(__dirname,"text/got.txt")
  ],
  break_text_on: "\n",
  lines_to_output: 10,
  sentences_per_line: 3,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});