const express = require('express');
const router = express.Router();
const verifyRoles = require('../../middleware/verifyRoles');
const { createClient } = require('@supabase/supabase-js');

router.get('/', verifyRoles(['manager']), async (req, res) => {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${req.session.token}`,
                    }
                }
            }
        );

        const { data: leaves, error } = await supabase
            .from('leaves')
            .select('*');

        if (error) {
            console.error('Error fetching leave requests:', error);
            return res.status(500).render('error', {
                status: 500,
                title: 'Leaves',
                message: 'Failed to load leave data.',
                description: error.message, // ✅ fixed
                url: req.originalUrl,
                stack: error.stack // ✅ fixed
            });
        }

        res.render('manager/leaves/index', {
            activePage: 'leaves',
            title: 'Leaves',
            leaves: leaves || []
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).render('error', {
            status: 500,
            title: 'Leaves',
            message: 'An unexpected error occurred.',
            description: err.message,
            url: req.originalUrl,
            stack: err.stack
        });
    }
});

module.exports = router;
