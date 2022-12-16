#!/usr/bin/env node
import { readFile, access } from 'fs/promises'
import { constants } from 'fs';
import colorize from 'json-colorizer'
import meow from 'meow'

const { input } = meow(`
	Usage
	  $ find-dependent <package-name>
`, {
  importMeta: import.meta,
});

if (input.length === 0) {
  console.error('Error: Specify package name')
  process.exit(1)
}

const fileName = 'package-lock.json'

await access(fileName, constants.R_OK)

const json = JSON.parse(await readFile(fileName, 'utf-8'))

const nm = 'node_modules/'

const paths = [
  'devDependencies',
  'dependencies',
  'peerDependencies',
  'requires'
]

const res = findPackages(json.packages, input[0], [])

console.log(colorize(JSON.stringify(res, null, 2)))


function findPackages(tree, name, current) {
  const matching = []
  for (const key in tree) {
    for (const path of paths) {
      const subtree = tree[key][path]
      if (!subtree) continue
      for (const subkey in subtree) {
        if (subkey === name) {
          matching.push(key)
        }
      }
    }
  }

  return {
    [name]: matching.map(item => {
      if (item.startsWith(nm)) {
        return findPackages(tree, item.slice(nm.length), [...current, item])
      } else {
        return findPackages(tree, item, [...current, item])
      }
    }).reduce((x, y) => ({ ...x, ...y }), {})
  }
}
