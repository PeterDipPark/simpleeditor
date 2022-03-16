import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

export default {
	input: './src/pm.js',
	output: {
		file: './dist-pm/pm.js',
		format: 'iife',
		name: 'pm',
		sourcemap: false
	},
	plugins: [  	
		commonjs(),										// Convert CommonJS modules to ES6, so they can be included in a Rollup bundle
		require('@rollup/plugin-buble')(),	 			// Convert ES2015 with buble.		
		terser(),										// Rollup plugin to minify generated es bundle. Uses terser under the hood. Incl. es6+
		resolve({										// Locate modules using the Node resolution algorithm, for using third party modules in node_modules
			customResolveOptions: {
				moduleDirectory: './pm_modules'
			},
			// jsnext: true, 	// DEPRECATED
			// main: true,		// DEPRECATED
			browser: true
		}),
	]
};