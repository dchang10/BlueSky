import './App.css';
import { create, all} from 'mathjs';
import React, { useState, useRef, useEffect } from 'react';
import * as xyzUtils from 'xyz-utils';

const config = { };
const math = create(all, config);

function App() {
  const [temperature, setTemperature] = useState(2600)
  const [skyColor, setSkyColor] = useState(getSkyColor(2600));
  const [starColor, setStarColor] = useState(getStarColor(2600));

  const tempRef = useRef()
  const starRef = useRef()
  const skyRef = useRef()


  return (
    <div style={{overflow:"hidden", height:"100vh", backgroundColor:skyColor}} ref={skyRef}>
      <div style={{height:"10%", padding:"25px 10% 25px 10%"}}>
        <div style={{textAlign:"center", fontSize:"xx-large"}}>
          {temperature + " K"}
        </div>
        <input 
          type="range" min="2600" max="10000" ref={tempRef} 
          style={{width:"100%", height:"25px", margin:"auto"}}
          onChange={() => {setTemperature(tempRef.current.value); setSkyColor(getSkyColor(tempRef.current.value)); setStarColor(getStarColor(tempRef.current.value))}}
        />
      </div>
      <div style={{position:"relative", overflow:"hidden", height:"90%", width:"100%", display:"flex", justifyContent:"center", alignItems:"center",margin:"auto"}}>
        <div className="sun" style={{backgroundColor:starColor}} ref={starRef}/>
      </div>
    </div>
  );
}



//var B = (lambda, temp) => (1.1911e-16)/ lambda**5 * (1 / (math.exp(0.0143881 / (lambda * temp)) - 1))
var B = (lambda, temp) => 1/ lambda**5 * (1 / (math.exp(14388.1 / (lambda * temp)) - 1))


function g(x, mu, sigma1, sigma2) {
  if (x < mu) { return math.exp(-math.pow(x-mu, 2) / sigma1**2) }

  return math.exp(-math.pow(x-mu, 2) / sigma2**2)

}

//var Z = (x) => 1.0217*g(x, 437e-9, 11.8e-9, 36e-9) + 0.681*g(x, 459e-9, 26e-9, 13.8e-9)
//var Y = (x) => 0.821*g(x, 568.8e-9, 46.9e-9, 40.5e-9) + 0.286*g(x, 530.9e-9, 16.3e-9, 31.1e-9)
//var X = (x) =>1.056*g(x, 599.8e-9, 37.9e-9,31e-9) + 0.362*g(x, 442e-9, 16e-9, 26.7e-9) - 0.065*g(x, 501.1e-9, 20.4e-9, 26.2e-9)
var Z = (x) => 1.0217*g(x, 437e-3, 11.8e-3, 36e-3) + 0.681*g(x, 459e-3, 26e-3, 13.8e-3)
var Y = (x) => 0.821*g(x, 568.8e-3, 46.9e-3, 40.5e-3) + 0.286*g(x, 530.9e-3, 16.3e-3, 31.1e-3)
var X = (x) =>1.056*g(x, 599.8e-3, 37.9e-3,31e-3) + 0.362*g(x, 442e-3, 16e-3, 26.7e-3) - 0.065*g(x, 501.1e-3, 20.4e-3, 26.2e-3)


function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function xyzTorgb(x, y, z) {/*https://en.wikipedia.org/wiki/CIE_1931_color_space*/
  let c =[0, 0, 0]
  //c[0] = 0.41847*x  - 0.15866*y - 0.082835*z
  //c[1] = (-0.091169)*x  + 0.0025243*y + 0.015708*z
  //c[2] = 0.00092090*x - 0.0025498*y +0.17860*z
  c[0] = 3.24066*x - 1.53772*y - 0.4986*z
  c[1]= -0.9689*x + 1.8758*y + 0.0415*z
  c[2] = 0.0557*x -0.2040*y +1.0570*z

  for(let i = 0; i < 3; i++ ) {
    let el = c[i];
    if(el <= 0.0031308) { 
      c[i] = 12.92*el
    } else {
      c[i] =  1.055*Math.pow(el,1/2.4)-0.55
    }
  }
  return c
}

function rgbToHex(r, g, b) { /*https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb*/
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getStarColor(temp) {
  let x = integrate(x=>B(x, temp)*X(x), 380e-3, 780e-3, 100, 1e-10, 1e-10);
  let y = integrate(x=>B(x, temp)*Y(x), 380e-3, 780e-3, 100, 1e-10, 1e-10);
  let z = integrate(x=>B(x, temp)*Z(x), 380e-3, 780e-3, 100, 1e-10, 1e-10);

  let tot = Math.max(x, y, z)
  //let rgb = xyzTorgb(x/tot, y/tot, z/tot)
  let rgb = xyzUtils.toRGB([x/tot, y/tot, z/tot])
  let red = rgb[0] 
  let green = rgb[1]
  let blue = rgb[2] 
  tot = Math.max(...rgb)
  //console.log("starColor", Math.trunc(red*255/tot), Math.trunc(green*255/tot), Math.trunc(blue*255/tot))
  console.log(parseInt("0x"+rgbToHex(Math.trunc(red*255/tot), Math.trunc(green*255/tot), Math.trunc(blue*255/tot)).substring(1,7)))
  return rgbToHex(Math.trunc(red*255/tot), Math.trunc(green*255/tot), Math.trunc(blue*255/tot))
}

function getSkyColor(temp) {
  let x = integrate(x=>B(x, temp) * X(x) / x**4, 0.380, 0.780, 100, 1e-10, 1e-10);
  let y = integrate(x=>B(x, temp) * Y(x) / x**4, 0.380, 0.780, 100, 1e-10, 1e-10);
  let z = integrate(x=>B(x, temp) * Z(x) / x**4, 0.380, 0.780, 100, 1e-10, 1e-10);

  //let tot = Math.max(x,y,z)
  //console.log("color(xyz "+Math.round(x/tot*100)/100 +" " + Math.round(100*y/tot)/100 + " "+ Math.round(100*z/tot)/100 + ")" )
  //return "color(xyz "+Math.round(x/tot*100)/100 +" " + Math.round(100*y/tot)/100 + " "+ Math.round(100*z/tot)/100 + ")" 
  let tot = Math.max(x,y,z)
  //let rgb = xyzTorgb(x/tot, y/tot, z/tot)
  let rgb = xyzUtils.toRGB([x/tot, y/tot, z/tot])
  let red = rgb[0]
  let green = rgb[1]
  let blue = rgb[2]
  tot = Math.max(...rgb)
  //console.log("skyColor", Math.trunc(red*255/tot), Math.trunc(green*255/tot), Math.trunc(blue*255/tot))
  return rgbToHex(Math.trunc(red*255/tot), Math.trunc(green*255/tot), Math.trunc(blue*255/tot))
}


/**
 * Estimates an integral using Romberg's Method (https://autarkaw.wordpress.com/2021/04/14/a-javascript-code-for-romberg-integration)
 * (https://en.wikipedia.org/wiki/Romberg%27s_method)
 * @param {function} func 
 * @param {number} a - lower bound of integration
 * @param {number} b - upper bound of integration
 * @param {number} nmax - number of partitions n = 2^nmax
 * @param {number} tol_ae - maximum absolute approximate error acceptable ( >= 0)
 * @param {number} tol_rae - maximum absolute relative approximate error acceptable ( >= 0)
 * @returns {number} estimated value of integral
 */
 function integrate(func, a, b, nmax, tol_ae, tol_rae) {
	let h = b-a

	// initialize matrix where the values of integral are stored
	let romb = []; // rows
	for (let i = 0; i < nmax+1; i++) 
	{
		romb.push([]);
		for (let j = 0; j < nmax + 1; j++) 
		{
			romb[i].push(math.bignumber(0)); 
		}
	}
	
	//calculating the value with 1-segment trapezoidal rule
	romb[0][0] = h * (func(a) + func(b)) / 2
	let integ_val = romb[0][0]
	
	for (let i = 1; i <= nmax; i++)
	// updating the value with double the number of segments
	// by only using the values where they need to be calculated
	// See https://autarkaw.org/2009/02/28/an-efficient-formula-for-an-automatic-integrator-based-on-trapezoidal-rule/
	{
		h = h / 2
		let integ = 0
		for (let j = 1; j <= 2 ** i - 1; j += 2)
		{
			integ = integ + func(a + j * h)
		}
	
		romb[i][0] = romb[i-1][0] / 2 + integ * h
		// Using Romberg method to calculate next extrapolatable value
		// See https://young.physics.ucsc.edu/115/romberg.pdf
		for (let k = 1; k <= i; k++)
		{   
			let addterm = romb[i][k-1] - romb[i-1][k-1]
			addterm = addterm/(4**k - 1.0)
			romb[i][k] = romb[i][k-1] + addterm

			//Calculating absolute approximate error
			let Ea = math.abs(romb[i][k] - romb[i][k-1])
			
			//Calculating absolute relative approximate error
			let epsa = math.abs(Ea / romb[i][k]) * 100.0
			
			//Assigning most recent value to the return variable
			integ_val = romb[i][k]
			
			// returning the value if either tolerance is met
			if ((epsa < tol_rae) || (Ea < tol_ae))
			{
				return(integ_val)
			}
		}
	}
	// returning the last calculated value of integral whether tolerance is met or not
	return(integ_val)
}       

export default App;
