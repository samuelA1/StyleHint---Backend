const router = require('express').Router();
const algoliasearch = require('algoliasearch');

const client = algoliasearch('X1ROWG5RKS', 'a63aabcab55f8ef4e22b097e3d518abe');
const index = client.initIndex('stylehint');

router.get('/', (req, res) => {
    if (req.query.query) {
        index.search({
            query: req.query.query,
            page: req.query.page}, (err, content) => {
                if (err) return err;
                
                res.json({
                    success: true,
                    message: 'search successful',
                    status: 200,
                    content: content,
                    search_results: req.query.query
                })
            })
    }
})

module.exports = router;