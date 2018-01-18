/* eslint-env node */
import React from 'react';
import Styletron from 'styletron-server';
import {StyletronProvider} from 'styletron-react';

import {createPlugin, dangerouslySetHTML} from 'fusion-core';

export default createPlugin({
  middleware: () => (ctx, next) => {
    if (ctx.element) {
      const styletron = new Styletron();

      ctx.element = (
        <StyletronProvider styletron={styletron}>
          {ctx.element}
        </StyletronProvider>
      );

      return next().then(() => {
        const stylesForHead = styletron.getStylesheetsHtml();
        ctx.template.head.push(dangerouslySetHTML(stylesForHead));
      });
    } else {
      return next();
    }
  },
});
