import React from 'react';
import { Box, Typography, Paper, Icon, useMediaQuery, useTheme } from "@mui/material";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WavesIcon from '@mui/icons-material/Waves';
import GroupIcon from '@mui/icons-material/Group';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TheatersIcon from '@mui/icons-material/Theaters';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useNavigate } from 'react-router-dom';
//import styled from '@mui/material';
import { ContentBox,IconBox } from '../../styles/scheduleshipmentStyle';
import { useStyles } from '../../styles/MyshipmentStyle';

const iconStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#D3D3D3', 
    padding: '14px 14px', 
    margin: 0,
    marginRight: '10px', 
};

const iconInnerStyle = {
    color: 'black', 
    fontSize: '24px' 
};

const paperStyle = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': { boxShadow: 3 }, 
    borderWidth: '1px',     
    borderColor: 'black', 
    
};
const ManagementDashboard = () => {
    const classes = useStyles();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleManagementClick = (section) => {
        const routes = {
            'User': '/admin/UserList',
            'Service': '/admin/ServiceList',
            'Vendor': '/admin/VendorList',
            'Container': '/admin/ContainerList',
            'Lead Assignment': '/admin/lead-assignment',
            'Consolidation Center': '/admin/consolidation-center',
            'Ocean Tracking': '/admin/ocean-tracking',
            'Sales Lead - Referred By': '/admin/sales-leads',
            'Invoices services': '/admin/invoices'
        };
        if (routes[section]) {
            navigate(routes[section]);
        }
    };

    return (
        <ContentBox>
                {/* Header Section */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
        <IconBox className="card-icon">
          <AssignmentIcon className={classes.iconBox} />
        </IconBox>
        Management
      </Typography>
                </Box>

                {/* Grid Section */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: isMobile ? 1 : 2,
                    padding: isMobile ? 1 : 1,
                }}>
                    {/* User */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('User')}>
            <div style={iconStyle}>
                <AccountBoxIcon style={iconInnerStyle} />
            </div>
            <Typography sx={{fontWeight:"bold"}}>User</Typography>
        </Paper>

                    {/* Service */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Service')}>
                        <div style={iconStyle}>
                        <EditIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Service</Typography>
                    </Paper>

                    {/* Vendor */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Vendor')}>
                        <div style={iconStyle}>
                        <FormatListBulletedIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Vendor</Typography>
                    </Paper>

                    {/* Container */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Container')}>
                        <div style={iconStyle}>
                        <TheatersIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Container</Typography>
                    </Paper>

                    {/* Lead Assignment */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Lead Assignment')}>
                        <div style={iconStyle}>
                        <ArchiveIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Lead Assignment</Typography>
                    </Paper>

                    {/* Consolidation Center */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Consolidation Center')}>
                        <div style={iconStyle}>
                        <LocationOnIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Consolidation Center</Typography>
                    </Paper>

                    {/* Ocean Tracking */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Ocean Tracking')}>
                        <div style={iconStyle}>
                        <WavesIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Ocean Tracking</Typography>
                    </Paper>

                    {/* Sales Lead - Referred By */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Sales Lead - Referred By')}>
                        <div style={iconStyle}>
                        <GroupIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Sales Lead - Referred By</Typography>
                    </Paper>

                    {/* Invoices Services */}
                    <Paper variant="outlined" sx={paperStyle} onClick={() => handleManagementClick('Invoices services')}>
                        <div style={iconStyle}>
                        <GroupIcon sx={iconInnerStyle} />
                        </div>
                        <Typography sx={{fontWeight:"bold"}}>Invoices services</Typography>
                    </Paper>
                </Box>
            </ContentBox>
    );
};

export default ManagementDashboard;