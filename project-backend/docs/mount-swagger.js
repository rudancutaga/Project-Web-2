const swaggerUi = require('swagger-ui-express');
const { buildSwaggerSpec } = require('./swagger.js');
const { docsAuth } = require('../middlewares/docs-auth-mw.js');

function mountSwagger(app) {
    app.get('/openapi.json', docsAuth, (req, res) => {
        const spec = buildSwaggerSpec();
        res.json(spec);
    });

    app.use(
        "/docs",
        docsAuth,
        swaggerUi.serve,
        swaggerUi.setup(buildSwaggerSpec(), {
            explorer: true,
            swaggerOptions: {
                persistAuthorization: true,
            },
        })
    );
};

module.exports = {
    mountSwagger,
};
