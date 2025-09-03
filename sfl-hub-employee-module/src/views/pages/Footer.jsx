import { Box, Typography } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { useStyles } from '../styles/MyshipmentStyle';

const Footer = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const classes = useStyles();

    return (
        <Box
            sx={{
                justifySelf: isMobile ? 'center' : 'flex-end',
                marginRight: 3,
                marginTop: 1,
                marginBottom: 1,
                bottom: 0,
            }}
        >
            <Typography
                align="center"
                className={classes.footerTypography}
                sx={{ fontSize: isMobile ? '12px' : '14px' }}
            >
                All Rights Reserved. Site Powered by{' '}
                <span
                    className={`${classes.sflLink} sfl-link`}
                    onClick={() => window.open('https://sflworldwide.com/', '_blank')}
                >
                    SFL Worldwide
                </span>
            </Typography>
        </Box>
    );
};

export default Footer;