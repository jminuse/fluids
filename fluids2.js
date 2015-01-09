function show(s) {
	document.getElementById('text-box').innerHTML = s;
}

var SX = 10;
var SY = 10;
var canvas = document.getElementById('myCanvas');
var g = canvas.getContext('2d');
var X = canvas.width/SX|0;
var Y = canvas.height/SX|0;
function I(x,y) {
	return Y*x+y;
}
function init_grid(initial_value) {
	vec = Array(X*Y);
	for(var x=0; x<X; x++) {
		for(var y=0; y<Y; y++) {
			vec[I(x,y)] = initial_value;
		}
	}
	return vec;
}
var default_density = 1.0;
v_density = init_grid(default_density);
v_density_new = init_grid(default_density);
v_density_sources = init_grid(0.0);
v_boundary = init_grid(0);
v_vx = init_grid(0.0);
v_vy = init_grid(0.0);
v_vx_new = init_grid(0.0);
v_vy_new = init_grid(0.0);
v_vx_sources = init_grid(0.0);
v_vy_sources = init_grid(0.0);

for(var y=Y/4; y<Y*3/4; y++) {
	v_boundary[I(X/2,y)] = 1;
	v_boundary[I(X/2-1,y)] = 1;
}

function display() {
	for(var x=0; x<X; x++) {
		for(var y=0; y<Y; y++) {
			if(v_boundary[I(x,y)] == 0) {
				var p = v_density[I(x,y)];
				g.fillStyle="hsl(240, "+(50*p|0)+"%, 50%)";
				g.fillRect(SX*x, SY*y, SX, SY);
			
			} else {
				g.fillStyle="black";
				g.fillRect(SX*x, SY*y, SX, SY);
			}
			//g.fillStyle="#000";
			//g.fillText(p, SX*(x+0.5), SY*(y+0.5));
		}
	}
	
	for(var x=0; x<X; x++) {
		for(var y=0; y<Y; y++) {
			g.strokeStyle="#FF0000";
			var vx = v_vx[I(x,y)];
			var vy = v_vy[I(x,y)];
			g.beginPath();
			g.moveTo(x*SX-vx*100, y*SY-vy*100);
			g.lineTo(x*SX+vx*100, y*SY+vy*100);
			g.stroke();
		}
	}
}

function add_sources(target, source, dt) {
	for(var i=0; i<target.length; i++) {
		target[i] += source[i]*dt;
	}
}

function apply_boundary_conditions(v1,dt) {
	for(var x=1; x<X-1; x++) {
		for(var y=1; y<Y-1; y++) {
			if(v_boundary[I(x,y)] != 0) {
				v_density_new[I(x,y)] = default_density;
				v_vx_new[I(x,y)] = 0.0;
				v_vy_new[I(x,y)] = 0.0;
			}
		}
	}
}

function diffusion(v0, v1, diffusion_rate, dt) {
	var total_diffusion = diffusion_rate*dt;
	for(var steps=0; steps<20; steps++) {
		for(var x=1; x<X-1; x++) {
			for(var y=1; y<Y-1; y++) {
				v1[I(x,y)] = (v0[I(x,y)] + total_diffusion*(v1[I(x-1,y)] + v1[I(x+1,y)] + v1[I(x,y-1)] + v1[I(x,y+1)]) )/(1+4*total_diffusion);
			}
		}
	}
	apply_boundary_conditions(v1,dt);
}

function advection(v0, v1, dt) {
	for(var i=1; i<X-1; i++) {
		for(var j=1; j<Y-1; j++) {
			var x = i-dt*v_vx[I(i,j)];
			var y = j-dt*v_vy[I(i,j)];
			if(x<0.5) x=0.5;	if(x>X-1.5) x=X-1.5;	var i0=x|0;	var i1=i0+1;
			if(y<0.5) y=0.5;	if(y>Y-1.5) y=Y-1.5;	var j0=y|0;	var j1=j0+1;
			var s1 = x-i0; var s0=1-s1;
			var t1 = y-j0; var t0=1-t1;
			v1[I(i,j)] = 
				s0*(t0*v0[I(i0,j0)] + t1*v0[I(i0,j1)]) + 
				s1*(t0*v0[I(i1,j0)] + t1*v0[I(i1,j1)]);
			
			if(isNaN( v1[I(i,j)] ) ) {
				show(s0+' '+s1+' '+t0+' '+t1+' | '+i0+' '+i1+' '+j0+' '+j1+' ');
				//s0*(t0*v_density[I(i0,j0)] + t1*v_density[I(i0,j1)]) + 
				//s1*(t0*v_density[I(i1,j0)] + t1*v_density[I(i1,j1)]);
			}
		}
	}
	apply_boundary_conditions(v1,dt);
}

var diffusivity = 0.01;
var viscosity = 0.1;
function timestep(dt) {
	add_sources(v_density, v_density_sources, dt);
	diffusion(v_density, v_density_new, diffusivity, dt);
	var swap=v_density; v_density=v_density_new; v_density_new=swap;
	advection(v_density, v_density_new, dt);
	swap=v_density; v_density=v_density_new; v_density_new=swap;
	
	add_sources(v_vx, v_vx_sources, dt);
	add_sources(v_vy, v_vy_sources, dt);
	diffusion(v_vx, v_vx_new, viscosity, dt);
	diffusion(v_vy, v_vy_new, viscosity, dt);
	swap=v_vx; v_vx=v_vx_new; v_vx_new=swap;
	swap=v_vy; v_vy=v_vy_new; v_vy_new=swap;
	advection(v_vx, v_vx_new, dt);
	advection(v_vy, v_vy_new, dt);
	swap=v_vx; v_vx=v_vx_new; v_vx_new=swap;
	swap=v_vy; v_vy=v_vy_new; v_vy_new=swap;
}

var previous_time = +new Date();
var count_frames = 0;
function animation(time) {
	var dt = time-previous_time;
	previous_time=time;
	count_frames++;
	show(Math.round(count_frames*1000/time) + ' fps');
	timestep(dt);
	display();
	requestAnimationFrame(animation);
}

requestAnimationFrame(animation);
window.onkeydown = function() {
	requestAnimationFrame(animation);
}

var previous_source = {x:0,y:0};
function add_source(m) {
	var x = m.clientX - canvas.getBoundingClientRect().left - canvas.clientLeft + canvas.scrollLeft;
	var y = m.clientY - canvas.getBoundingClientRect().top - canvas.clientTop + canvas.scrollTop;
	var sx=x/SX|0; var sy=y/SY|0;
	if(m.button==0) v_density_sources[I(sx,sy)] = 1.0;
	if(m.button==2) {
		var dx = sx - previous_source.x;
		var dy = sy - previous_source.y;
		v_vx_sources[I(sx,sy)] = dx*0.1;
		v_vy_sources[I(sx,sy)] = dy*0.1;
	}
	previous_source.x = sx;
	previous_source.y = sy;
}
function delete_source() {
	v_density_sources[I(previous_source.x,previous_source.y)] = 0.0;
	v_vx_sources[I(previous_source.x,previous_source.y)] = 0.0;
	v_vy_sources[I(previous_source.x,previous_source.y)] = 0.0;
}
var mousepressed = false;
canvas.onmousedown = function(m) {
	m.preventDefault();
	mousepressed = true;
	add_source(m);
	return false;
}
window.onmouseup = function(m) {
	m.preventDefault();
	mousepressed = false;
	delete_source();
	return false;
}
canvas.onmousemove = function(m) {
	m.preventDefault();
	if(mousepressed) {
		delete_source();
		add_source(m);
	}
	return false;
}
canvas.oncontextmenu = function(e) {
	e.preventDefault();
	return false;
}
