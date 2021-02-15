{
	function reduceModes(modes) {
  	modes = new Set(modes);
    if (modes.has('a') || modes.size >= 4) return 'a';
    return Array.from(modes).join('');
  }
}
expr
	  = _ e:_expr _ { return e }
_expr
    = init:init __ cmds:commands { return { init, commands: cmds } }
    / cmd:commands { return { init: {modes: 'f', offset: 0 }, commands: cmd } }
init
    = modes:modes offset:integer { return {modes, offset}}
    / offset:integer modes:modes { return {modes, offset}}
    / offset:integer { return {modes: 'f', offset} }
    / modes:modes { return {modes, offset: 0} }
commands
    = g:multCmd __ cmds:commands { return [...g, ...cmds] }
    / g:multCmd { return [...g] }
multCmd
    = g:cmdGroup '*' n:posInteger { return Array(n).fill(g) }
    / g:cmdGroup { return [g] }
cmdGroup
    = cmd:offsetCmd '&' g:cmdGroup { return [cmd, ...g] }
    / cmd:offsetCmd { return [cmd] }

offsetCmd
    = cmd:cmd_or_i s:sign offset:integer { return {cmd, offset: offset * s} }
    / cmd:cmd_or_i { return {cmd, offset: 0} }
sign
    = s:[+-] { return (s === '+') * 2 - 1 }
cmd_or_i
    = command / posInteger
command
    = m:[FCfc] { return m.toLowerCase() }
modes
	= dir:[+-]? modes:mode+ { return (dir ?? '') + reduceModes(modes) }
mode
    = s:[FLRBAflrba] { return s.toLowerCase() }
posInteger
    = [+]*[0-9]+ { return Number(text()) }
integer
    = [+-]*[0-9]+ { return Number(text()) }
_ 'whitespace'
	= [ \t\n\r]*

__ 'blank'
  = [ \t\n\r]+