import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

export default {
	input: './src/se.js',
	output: {
		file: './dist-se/js/se.js',
		format: 'iife',
		name: 'se',
		sourcemap: false
	},
	plugins: [  	
		commonjs(),										// Convert CommonJS modules to ES6, so they can be included in a Rollup bundle
		require('@rollup/plugin-buble')(),	 			// Convert ES2015 with buble.		
		terser(),										// Rollup plugin to minify generated es bundle. Uses terser under the hood. Incl. es6+
		replace({										// Rollup plugin which replaces strings in files while bundling (https://www.npmjs.com/package/@rollup/plugin-replace)
	      preventAssignment: true,
	      ProseMirror: 'simpleeditor'
	      ,'of prosemirror-model': 'of the model',
	      '(see https://prosemirror.net/docs/guide/#generatable)': '',
	      'style/prosemirror': 'css/se.css',
	      'from the prosemirror-view':'dist'
	    }),
		resolve({										// Locate modules using the Node resolution algorithm, for using third party modules in node_modules
			customResolveOptions: {
				moduleDirectory: ['./pm_modules','./se_modules']
			},
			// jsnext: true, 	// DEPRECATED
			// main: true,		// DEPRECATED
			browser: true
		}),
	]
};