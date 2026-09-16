import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { Quotation, DiscountApprovalRequest, PriceHistory } from '../../shared/types';
import { syncQuotationToPostgres, deleteQuotationFromPostgres, syncPriceHistoryToPostgres } from '../postgresDb';

const router = Router();

// Quotations API
router.get('/api/quotations', (req, res) => {
  res.json(store.quotations);
});

router.post('/api/quotations', (req, res) => {
  const isMainBranchHO = req.body.branch_id === 'b-ho' || req.body.branch_code === 'HO' || req.body.is_main_branch === true;
  const qNum = req.body.quotation_number || `INV-QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const randomCode = Math.floor(100000 + Math.random() * 900000);

  const quotationType = isMainBranchHO ? 'VALIDATED_OFFICIAL' : 'TEMPORARY_BRANCH_DRAFT';
  const status = isMainBranchHO ? 'Validated Official' : 'Temporary Branch Draft';
  const barcode = isMainBranchHO ? `BC-HO-${new Date().getFullYear()}-${randomCode}` : `BC-TEMP-${new Date().getFullYear()}-${randomCode}`;
  const extRef = isMainBranchHO ? (req.body.external_software_ref || `EXT-ERP-${Math.floor(10000 + Math.random() * 90000)}`) : undefined;

  const netTotal = Number(req.body.net_total) || 0;
  const custName = req.body.customer_name || 'Valued Client';
  const bName = req.body.branch_name || 'Regional Branch';

  const qrPayload = JSON.stringify({
    type: quotationType,
    num: qNum,
    branch: bName,
    customer: custName,
    total: netTotal,
    barcode,
    ext_ref: extRef,
    issued_at: new Date().toISOString()
  });

  const q: Quotation = {
    id: `qt-${Date.now()}`,
    quotation_number: qNum,
    quotation_type: quotationType,
    barcode,
    qr_code_data: qrPayload,
    customer_name: custName,
    customer_phone: req.body.customer_phone || '',
    site_address: req.body.site_address || '',
    site_location_name: req.body.site_location_name || 'Site',
    branch_id: req.body.branch_id || 'b-cmb',
    branch_name: bName,
    date: new Date().toISOString().split('T')[0],
    valid_until: req.body.valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: req.body.status || status,
    items: req.body.items || [],
    transport_details: req.body.transport_details,
    material_subtotal: Number(req.body.material_subtotal) || 0,
    fabrication_cost: Number(req.body.fabrication_cost) || 0,
    installation_cost: Number(req.body.installation_cost) || 0,
    transport_cost: Number(req.body.transport_cost) || 0,
    gross_total: Number(req.body.gross_total) || 0,
    discount_pct: Number(req.body.discount_pct) || 0,
    discount_amount: Number(req.body.discount_amount) || 0,
    tax_pct: Number(req.body.tax_pct) || 0,
    tax_amount: Number(req.body.tax_amount) || 0,
    net_total: netTotal,
    notes: req.body.notes || (isMainBranchHO ? 'Official Main Branch Validated Quotation.' : 'Temporary Branch Draft Quotation. Requires Main Branch HO Validation.'),
    created_by: req.body.created_by || 'Branch Representative',
    external_software_ref: extRef,
    validated_at: isMainBranchHO ? new Date().toLocaleString() : undefined,
    validated_by: isMainBranchHO ? (req.body.created_by || 'HO Master Admin') : undefined
  };

  store.quotations.unshift(q);

  // Forensic Audit Log Entry for Quotation Creation
  const quoteAudit: PriceHistory = {
    id: `ph-qt-${Date.now()}`,
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_CREATED',
    quotation_id: q.id,
    quotation_number: q.quotation_number,
    customer_name: q.customer_name,
    product_code: q.quotation_number,
    product_name: `Quotation: ${q.customer_name} (${q.items?.length || 0} items)`,
    old_price: 0,
    new_price: q.net_total,
    changed_by: req.body.actor_name || req.body.created_by || q.created_by || 'Sales Representative',
    changed_by_role: req.body.role || req.body.created_by_role || 'Sales Executive',
    changed_date: new Date().toLocaleString(),
    reason: req.body.notes || (isMainBranchHO ? 'Official Main Branch Validated Quotation issued' : 'Branch draft quotation generated'),
    branch_affected: q.branch_name,
    change_summary: `Created ${quotationType === 'VALIDATED_OFFICIAL' ? 'Official' : 'Draft'} Quotation ${q.quotation_number} for ${q.customer_name} totaling Rs. ${(q.net_total || 0).toLocaleString()} (Material: Rs. ${(q.material_subtotal || 0).toLocaleString()}, Transport: Rs. ${(q.transport_cost || 0).toLocaleString()}, Disc: Rs. ${(q.discount_amount || 0).toLocaleString()})`
  };
  store.priceHistory.unshift(quoteAudit);

  saveDatabase();
  syncQuotationToPostgres(q);
  syncPriceHistoryToPostgres(quoteAudit);

  broadcastEvent({
    type: 'NEW_QUOTATION',
    title: isMainBranchHO ? '📜 Official Main Branch Quotation Issued' : '📋 Temporary Branch Draft Quotation Created',
    message: `${q.quotation_number} (${quotationType}) generated at ${q.branch_name} for ${q.customer_name} (Total: Rs. ${(q.net_total ?? 0).toLocaleString()}). Barcode: ${q.barcode}`,
    branch_name: q.branch_name
  });

  res.json(q);
});

router.post('/api/quotations/:id/validate', (req, res) => {
  const { id } = req.params;
  const { validated_by, external_software_ref, validation_notes } = req.body;

  const q = store.quotations.find(item => item.id === id || item.quotation_number === id);
  if (!q) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  const randomCode = Math.floor(100000 + Math.random() * 900000);
  const newBarcode = `BC-HO-${new Date().getFullYear()}-${randomCode}`;
  const extRef = external_software_ref || `EXT-ERP-${Math.floor(10000 + Math.random() * 90000)}`;

  q.quotation_type = 'VALIDATED_OFFICIAL';
  q.status = 'Validated Official';
  q.barcode = newBarcode;
  q.external_software_ref = extRef;
  q.validated_at = new Date().toLocaleString();
  q.validated_by = validated_by || 'HO Master Admin';
  q.validation_notes = validation_notes || 'Validated & certified by Main Branch Head Office.';

  q.qr_code_data = JSON.stringify({
    type: 'VALIDATED_OFFICIAL',
    num: q.quotation_number,
    branch: q.branch_name,
    customer: q.customer_name,
    total: q.net_total,
    barcode: newBarcode,
    ext_ref: extRef,
    validated_at: q.validated_at,
    validated_by: q.validated_by
  });

  // Forensic Audit Log Entry for Quotation Validation
  const validateAudit: PriceHistory = {
    id: `ph-qt-val-${Date.now()}`,
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_STATUS_CHANGE',
    quotation_id: q.id,
    quotation_number: q.quotation_number,
    customer_name: q.customer_name,
    product_code: q.quotation_number,
    product_name: `Quotation: ${q.customer_name}`,
    old_price: q.net_total,
    new_price: q.net_total,
    changed_by: validated_by || req.body.actor_name || 'HO Master Admin',
    changed_by_role: req.body.role || 'Super Admin',
    changed_date: new Date().toLocaleString(),
    reason: validation_notes || 'Official Head Office certification and barcode issuance',
    branch_affected: q.branch_name,
    change_summary: `Validated official quotation. Official Barcode: ${newBarcode}, External Ref: ${extRef}, Status: Validated Official`,
    old_status: 'Temporary Branch Draft',
    new_status: 'Validated Official'
  };
  store.priceHistory.unshift(validateAudit);

  saveDatabase();

  broadcastEvent({
    type: 'NEW_QUOTATION',
    title: '✅ Temporary Branch Draft VALIDATED by Main Branch',
    message: `Quotation ${q.quotation_number} (originally from ${q.branch_name}) has been validated by Main Branch HO. Official Barcode: ${newBarcode}, Ref: ${extRef}`,
    branch_name: 'Head Office'
  });

  res.json(q);
});

// Update Quotation API
router.put('/api/quotations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.quotations.findIndex(item => 
      item.id === id || 
      item.quotation_number === id ||
      item.id.toLowerCase() === targetId ||
      item.quotation_number.toLowerCase() === targetId
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const oldQuotation = store.quotations[idx];
    const oldNet = oldQuotation.net_total || 0;
    const newNet = Number(req.body.net_total !== undefined ? req.body.net_total : oldQuotation.net_total) || 0;
    const oldDisc = oldQuotation.discount_pct || 0;
    const newDisc = req.body.discount_pct !== undefined ? req.body.discount_pct : oldDisc;
    const statusChanged = req.body.status && req.body.status !== oldQuotation.status;
    const discountChanged = newDisc !== oldDisc;
    const priceChanged = newNet !== oldNet;
    const itemsChanged = req.body.items && JSON.stringify(req.body.items) !== JSON.stringify(oldQuotation.items);

    const summaryItems: string[] = [];
    if (priceChanged) summaryItems.push(`Total: Rs. ${oldNet.toLocaleString()} → Rs. ${newNet.toLocaleString()} (${newNet > oldNet ? '+' : ''}Rs. ${(newNet - oldNet).toLocaleString()})`);
    if (discountChanged) summaryItems.push(`Discount: ${oldDisc}% → ${newDisc}%`);
    if (statusChanged) summaryItems.push(`Status: ${oldQuotation.status} → ${req.body.status}`);
    if (itemsChanged) summaryItems.push(`Items modified (${req.body.items?.length || 0} line items)`);

    const changeSummary = summaryItems.length > 0 
      ? summaryItems.join(' | ') 
      : `Quotation ${oldQuotation.quotation_number} revised specifications & details`;

    const updatedQuotation: Quotation = {
      ...store.quotations[idx],
      ...req.body
    };

    store.quotations[idx] = updatedQuotation;

    // Forensic Audit Log Entry for Quotation Modification
    const updateAudit: PriceHistory = {
      id: `ph-qt-upd-${Date.now()}`,
      entity_type: 'QUOTATION',
      update_type: statusChanged ? 'QUOTATION_STATUS_CHANGE' : (discountChanged ? 'QUOTATION_DISCOUNT' : 'QUOTATION_MODIFICATION'),
      quotation_id: oldQuotation.id,
      quotation_number: oldQuotation.quotation_number,
      customer_name: updatedQuotation.customer_name,
      product_code: updatedQuotation.quotation_number,
      product_name: `Quotation: ${updatedQuotation.customer_name}`,
      old_price: oldNet,
      new_price: newNet,
      changed_by: req.body.updated_by || req.body.actor_name || updatedQuotation.created_by || 'Authorized User',
      changed_by_role: req.body.role || req.body.updated_by_role || 'Branch Manager',
      changed_date: new Date().toLocaleString(),
      reason: req.body.update_reason || req.body.notes || 'Quotation specifications, line items or pricing modified',
      branch_affected: updatedQuotation.branch_name,
      change_summary: changeSummary,
      old_status: oldQuotation.status,
      new_status: updatedQuotation.status
    };
    store.priceHistory.unshift(updateAudit);

    saveDatabase();

    broadcastEvent({
      type: 'NEW_QUOTATION',
      title: '📝 Quotation Updated',
      message: `Quotation ${updatedQuotation.quotation_number} updated for ${updatedQuotation.customer_name}: ${changeSummary}`,
      branch_name: updatedQuotation.branch_name
    });

    res.json(updatedQuotation);
  } catch (err: any) {
    console.error('Error updating quotation:', err);
    res.status(500).json({ error: 'Failed to update quotation: ' + (err?.message || 'Server error') });
  }
});

// Request Order Removal with Remark (Sales Manager / Executive workflow)
router.post('/api/quotations/:id/request-removal', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, requested_by, requested_role } = req.body;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.quotations.findIndex(item => 
      item.id === id || 
      item.quotation_number === id ||
      item.id.toLowerCase() === targetId ||
      item.quotation_number.toLowerCase() === targetId
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A removal remark / reason is required.' });
    }

    const updated: Quotation = {
      ...store.quotations[idx],
      deletion_requested: true,
      deletion_reason: reason.trim(),
      deletion_requested_by: requested_by || 'Sales Executive',
      deletion_requested_role: requested_role || 'Sales Executive',
      deletion_requested_at: new Date().toISOString()
    };

    store.quotations[idx] = updated;

    // Forensic Audit Log Entry for Quotation Removal Request
    const removalAudit: PriceHistory = {
      id: `ph-qt-rem-${Date.now()}`,
      entity_type: 'QUOTATION',
      update_type: 'QUOTATION_DELETION_REQUEST',
      quotation_id: updated.id,
      quotation_number: updated.quotation_number,
      customer_name: updated.customer_name,
      product_code: updated.quotation_number,
      product_name: `Quotation: ${updated.customer_name}`,
      old_price: updated.net_total,
      new_price: updated.net_total,
      changed_by: requested_by || 'Sales Executive',
      changed_by_role: requested_role || 'Sales Executive',
      changed_date: new Date().toLocaleString(),
      reason: reason.trim(),
      branch_affected: updated.branch_name,
      change_summary: `Removal requested for Order ${updated.quotation_number} with justification: "${reason.trim()}"`
    };
    store.priceHistory.unshift(removalAudit);

    saveDatabase();

    broadcastEvent({
      type: 'NEW_QUOTATION',
      title: '⚠️ Order Removal Requested',
      message: `Removal requested for Order ${updated.quotation_number} by ${requested_by || 'Sales Manager'}. Remark: "${reason.trim()}"`,
      branch_name: updated.branch_name
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error requesting quotation removal:', err);
    res.status(500).json({ error: 'Failed to submit removal request: ' + (err?.message || 'Server error') });
  }
});

// Reject Order Removal Request (Admin workflow)
router.post('/api/quotations/:id/reject-removal', (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_by, role } = req.body;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.quotations.findIndex(item => 
      item.id === id || 
      item.quotation_number === id ||
      item.id.toLowerCase() === targetId ||
      item.quotation_number.toLowerCase() === targetId
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const priorRemark = store.quotations[idx].deletion_reason;
    const updated: Quotation = {
      ...store.quotations[idx],
      deletion_requested: false,
      deletion_reason: undefined,
      deletion_requested_by: undefined,
      deletion_requested_role: undefined,
      deletion_requested_at: undefined
    };

    store.quotations[idx] = updated;

    // Forensic Audit Log Entry for Deletion Rejection
    const rejectAudit: PriceHistory = {
      id: `ph-qt-rej-${Date.now()}`,
      entity_type: 'QUOTATION',
      update_type: 'QUOTATION_DELETION_REJECTED',
      quotation_id: updated.id,
      quotation_number: updated.quotation_number,
      customer_name: updated.customer_name,
      product_code: updated.quotation_number,
      product_name: `Quotation: ${updated.customer_name}`,
      old_price: updated.net_total,
      new_price: updated.net_total,
      changed_by: rejected_by || 'Admin',
      changed_by_role: role || 'Super Admin',
      changed_date: new Date().toLocaleString(),
      reason: 'Removal request declined by administrative authority; order retained in ledger',
      branch_affected: updated.branch_name,
      change_summary: `Declined removal request for Order ${updated.quotation_number} (Prior remark: "${priorRemark || 'N/A'}")`
    };
    store.priceHistory.unshift(rejectAudit);

    saveDatabase();

    broadcastEvent({
      type: 'NEW_QUOTATION',
      title: '🛡️ Order Removal Declined',
      message: `Removal request for Order ${updated.quotation_number} was rejected by ${rejected_by || 'Admin'}. Order retained active.`,
      branch_name: updated.branch_name
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error rejecting quotation removal:', err);
    res.status(500).json({ error: 'Failed to reject removal request: ' + (err?.message || 'Server error') });
  }
});

// Delete Quotation API - Restricted to Branch Admin (Branch Manager), Super Admin, and HO Admin
router.delete('/api/quotations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { deleted_by, role, remark } = req.body || {};
    const targetId = (id || '').trim().toLowerCase();
    const found = store.quotations.find(item => 
      item.id === id || 
      item.quotation_number === id ||
      item.id.toLowerCase() === targetId ||
      item.quotation_number.toLowerCase() === targetId
    );
    if (!found) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Role check if provided
    if (role && !['Super Admin', 'HO Admin', 'Branch Manager'].includes(role)) {
      return res.status(403).json({ error: 'Unauthorized: Only Branch Admin, HO Admin, and Super Admin can delete orders.' });
    }

    store.quotations = store.quotations.filter(item => 
      item.id !== found.id && item.quotation_number !== found.quotation_number
    );

    // Forensic Audit Log Entry for Quotation Deletion
    const deleteAudit: PriceHistory = {
      id: `ph-qt-del-${Date.now()}`,
      entity_type: 'QUOTATION',
      update_type: 'QUOTATION_STATUS_CHANGE',
      quotation_id: found.id,
      quotation_number: found.quotation_number,
      customer_name: found.customer_name,
      product_code: found.quotation_number,
      product_name: `Quotation: ${found.customer_name}`,
      old_price: found.net_total,
      new_price: 0,
      changed_by: deleted_by || 'Admin',
      changed_by_role: role || 'Super Admin',
      changed_date: new Date().toLocaleString(),
      reason: remark || 'Order deletion performed by authorized role',
      branch_affected: found.branch_name,
      change_summary: `Quotation ${found.quotation_number} permanently expunged by ${role || 'Admin'} (Remark: "${remark || 'None'}")`
    };
    store.priceHistory.unshift(deleteAudit);
    saveDatabase();

    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '🗑️ Order Permanently Deleted',
      message: `Order #${found.quotation_number} (${found.customer_name}) deleted by ${deleted_by || 'Admin'}${remark ? ` • Remark: "${remark}"` : ''}`,
      branch_name: found.branch_name
    });

    res.json({ success: true, id, quotation_number: found.quotation_number });
  } catch (err: any) {
    console.error('Error deleting quotation:', err);
    res.status(500).json({ error: 'Failed to delete quotation: ' + (err?.message || 'Server error') });
  }
});

// Discount Approval Requests API
router.get('/api/discount-requests', (req, res) => {
  res.json(store.discountRequests);
});

router.post('/api/discount-requests', (req, res) => {
  const newReq: DiscountApprovalRequest = {
    id: `dr-${Date.now()}`,
    quotation_id: req.body.quotation_id,
    quotation_number: req.body.quotation_number || `INV-QT-${new Date().getFullYear()}-000`,
    branch_id: req.body.branch_id || 'b-cmb',
    branch_name: req.body.branch_name || 'Regional Branch',
    requested_by: req.body.requested_by || 'Sales Executive',
    customer_name: req.body.customer_name || 'Client',
    original_amount: Number(req.body.original_amount) || 0,
    requested_discount_pct: Number(req.body.requested_discount_pct) || 0,
    discounted_amount: Number(req.body.discounted_amount) || 0,
    reason: req.body.reason || 'Special discount requested',
    status: 'Pending',
    created_at: new Date().toISOString().split('T')[0],
    notes: req.body.notes
  };

  store.discountRequests.unshift(newReq);
  saveDatabase();

  broadcastEvent({
    type: 'PRICE_PROPOSAL',
    title: `Discount Approval Request Submitted`,
    message: `${newReq.requested_by} requested ${newReq.requested_discount_pct}% discount on quote ${newReq.quotation_number}`,
    branch_name: newReq.branch_name
  });

  res.json(newReq);
});

router.post('/api/discount-requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approved, reviewed_by, notes } = req.body;

  const reqItem = store.discountRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  reqItem.status = approved ? 'Approved' : 'Rejected';
  reqItem.reviewed_by = reviewed_by || 'HO Super Admin';
  reqItem.review_date = new Date().toISOString().split('T')[0];
  if (notes) reqItem.notes = notes;

  saveDatabase();

  broadcastEvent({
    type: 'PRICE_PROPOSAL',
    title: approved ? `✅ Discount Approved by HO` : `❌ Discount Rejected by HO`,
    message: `Discount request for ${reqItem.quotation_number} (${reqItem.customer_name}) was ${reqItem.status.toLowerCase()} by ${reqItem.reviewed_by}`,
    branch_name: reqItem.branch_name
  });

  res.json(reqItem);
});

export default router;
