import React from 'react';
import AdminServicesPanel from '../../../../src/components/admin/AdminServicesPanel';

// Thin wrapper to keep tab responsibilities isolated.
export default function AdminServicesTab(props) {
  return <AdminServicesPanel {...props} />;
}

