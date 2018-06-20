#!/usr/bin/env node

var commander=require("commander");
const fs = require('fs');
const readline = require('readline');
const Path = require('path');

commander
.option('-f, --find <rexexp>', 'Regexp for finding target string',parseRegExp,/.*/)
.option('-r, --replace <replacement>', 'Replacement string',String,'')
.option('-m, --match <rexexp>', 'Regexp for matching files (default: the same as find)',parseRegExp)
.option('--keep-order', 'Do not reorder the file list. By default the namer will reorder file names by their length.')
.option('-y, --yes', 'Do not ask for confirmation');
commander.on('--help', function(){
	[
		'',
		'    Regexps in the parameters can be with or without // warper(The wraper can be used when you need regexp flags "i" or "g").',
		'    You may need to add "\\" before some signs in your command environment.',
		'    The replacement will become the second parameter of string.replace function in javascript. So several special signs can be used.',
		'',
		'  Special javascript replacement patterns',
		'    $$            Inserts a "$"',
		'    $&            Inserts the matched substring',
		'    $`            Inserts the portion of the string that precedes the matched substring',
		'    $\'            Inserts the portion of the string that follows the matched substring',
		'    $n            Insert the nth submatch group, from 1 ot 100',
		'  Extra replacement patterns',
		'    #COUNTER      Inserts a counter number which is the index of the file in the match list (starts from 1)',
		'',
		'  Examples:',
		'',
		'    namer -m w.s -f poi                        #remove string matches /poi/ from names that matches /w.s/',
		'    namer -f "p(o+)i" -r "$1"                  #(special replacement patterns)cut "p" and "i" sticks to the "o"s for files that can be matched',
		'    namer -f /aaaaaa/i -r b                    #(ignore case)replace /aaaaaa/i mode to "b" for files that can be matched',
		'    namer -f some*pics\\.png -r "#COUNTER.png"  #change the names to numbers for some png files that can be matched',
		'',
	].forEach(function(l){console.log(l)});
});


commander.parse(process.argv);

//set match to find if not set
if(commander.match===undefined)commander.match=commander.find;
console.log('match:',commander.match,"  find:",commander.find,"  replacement:",commander.replace);

var replaceList=[];
var cwd=process.cwd();
var counter=0;
//match files
var dirList=fs.readdirSync(cwd);
//order the list
if(commander.keepOrder!==true)
	dirList.sort(function(pre,aft){
		return pre.length-aft.length;
	});
console.log("Match list:");
dirList.forEach(function(name){
	if(name==='.'||name==='..')return;
	if(name.match(commander.match)){
		counter++;
		var newName=name.replace(commander.find,commander.replace).replace(/\#COUNTER/g,counter);
		console.log(name,"\t>\t"+newName);
		replaceList.push([name,newName]);
	}
});
console.log('\n');
if(replaceList.length===0){
	console.log("no files matched");
	return;
}else{
	console.log(replaceList.length+"matches found.");
}
if(commander.yes!==true){
	const rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	rl.question('Confirm?    (control+c to exit)\n',()=> {
		startReplace();
		rl.close();
	});
}else{startReplace();}


//funcitons

function parseRegExp(str){
	var reg,exp,flags;
	if(reg=str.match(/^\/(.+)\/([ig]*)$/)){
		exp=reg[1];
		flags=reg[2];
	}else{
		exp=str;
		flags='';
	}
	var r=new RegExp(exp,flags);
	return r;
}
function startReplace(){
	var success=0,failed=0;
	replaceList.forEach(function(names){
		try{
			fs.renameSync(Path.resolve(cwd,names[0]),Path.resolve(cwd,names[1]));
			success++;
		}catch(e){
			failed++;
			console.error(e.message);
		}
	});
	console.log("Finished. "+success+"succeeded,"+failed+"failed");
	// process.exit(0);
}