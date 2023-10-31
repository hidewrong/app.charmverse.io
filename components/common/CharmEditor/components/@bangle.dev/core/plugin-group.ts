import type { Plugin } from '@bangle.dev/pm';

interface DeepPluginArray extends Array<Plugin | DeepPluginArray> {}

export class PluginGroup {
  // eslint-disable-next-line no-empty-function, no-useless-constructor
  constructor(public name: string, public plugins: DeepPluginArray) {}
}
