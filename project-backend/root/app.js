const express = require('express');
const cors = require('cors');

const errorMW = require('../middlewares/error-mw.js');
const responseMW = require('../middlewares/response-mw.js');

const userRoutes = require('./routes/user-r.js');
const todoRoutes = require('./routes/todo-r.js');
const authRoutes = require('./routes/auth-r.js');
const gameRoutes = require('./routes/games-r.js');
const sessionRoutes = require('./routes/sessions-r.js');
const socialRoutes = require('./routes/social-r.js');
const adminRoutes = require('./routes/admin-r.js');

const { mountSwagger } = require('../docs/mount-swagger.js');
const { requestContext } = require('../middlewares/request-context.js');
const { accessLogger } = require('../middlewares/access-logger.js');
const { requireApiKey } = require('../middlewares/api-key-mw.js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestContext());
app.use(accessLogger());
app.use(responseMW());
app.use('/api/v1', requireApiKey);

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/todos', todoRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/admin', adminRoutes);

mountSwagger(app);

// 404 handler
app.use((req, res, next) => {
    return res.error(
        new Error(`Can not find ${req.originalUrl} on this server`),
        404
    );
});

// error handler
app.use(errorMW);

module.exports = app;
