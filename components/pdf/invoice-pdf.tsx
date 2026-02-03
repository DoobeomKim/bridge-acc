/**
 * Invoice PDF Template
 * 독일 인보이스 규격에 맞는 PDF 템플릿
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Noto Sans KR 폰트 등록 (한글 지원)
// 서버사이드에서 실행되므로 절대 경로 사용
Font.register({
  family: 'Noto Sans KR',
  src: `${process.cwd()}/public/fonts/NotoSansKR-Regular.ttf`,
});

// 스타일 정의
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Noto Sans KR',
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBlock: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  col1: { width: '5%' },
  col2: { width: '40%' },
  col3: { width: '10%', textAlign: 'right' },
  col4: { width: '10%', textAlign: 'right' },
  col5: { width: '10%', textAlign: 'right' },
  col6: { width: '10%', textAlign: 'right' },
  col7: { width: '15%', textAlign: 'right' },
  totals: {
    marginLeft: 'auto',
    width: '40%',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 5,
    fontWeight: 'bold',
    fontSize: 12,
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    padding: 5,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    deliveryDate?: string;
    dueDate: string;
    paymentTerms: string;
    subtotal: number;
    totalVat: number;
    totalGross: number;
    notes?: string;
    terms?: string;
    correctionType?: string;
    customer: {
      customerNumber: string;
      name: string;
      company?: string;
      address?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      vatRate: number;
      total: number;
    }>;
  };
  settings: {
    companyName?: string;
    address?: string;
    taxNumber?: string;
    vatId?: string;
  };
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 회사 헤더 */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {settings.companyName || 'Bridge Acc'}
          </Text>
          {settings.address && (
            <Text style={styles.companyInfo}>{settings.address}</Text>
          )}
          {settings.taxNumber && (
            <Text style={styles.companyInfo}>Steuernummer: {settings.taxNumber}</Text>
          )}
          {settings.vatId && (
            <Text style={styles.companyInfo}>USt-IdNr.: {settings.vatId}</Text>
          )}
        </View>

        {/* 취소/정정 배지 */}
        {invoice.correctionType === 'cancellation' && (
          <View style={styles.badge}>
            <Text>STORNO-RECHNUNG</Text>
          </View>
        )}
        {invoice.correctionType === 'correction' && (
          <View style={styles.badge}>
            <Text>KORREKTURRECHNUNG</Text>
          </View>
        )}

        {/* 고객 정보 */}
        <View>
          <Text style={styles.infoLabel}>Empfänger</Text>
          <Text style={styles.infoValue}>{invoice.customer.name}</Text>
          {invoice.customer.company && (
            <Text style={styles.infoValue}>{invoice.customer.company}</Text>
          )}
          {invoice.customer.address && (
            <Text style={styles.infoValue}>{invoice.customer.address}</Text>
          )}
          {invoice.customer.postalCode && invoice.customer.city && (
            <Text style={styles.infoValue}>
              {invoice.customer.postalCode} {invoice.customer.city}
            </Text>
          )}
        </View>

        {/* 제목 */}
        <Text style={styles.title}>Rechnung {invoice.invoiceNumber}</Text>

        {/* 인보이스 정보 */}
        <View style={styles.invoiceInfo}>
          <View style={styles.infoBlock}>
            <View>
              <Text style={styles.infoLabel}>Rechnungsdatum</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            {invoice.deliveryDate && (
              <View>
                <Text style={styles.infoLabel}>Lieferdatum</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.deliveryDate)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.infoLabel}>Kundennummer</Text>
              <Text style={styles.infoValue}>{invoice.customer.customerNumber}</Text>
            </View>
          </View>
          <View style={styles.infoBlock}>
            <View>
              <Text style={styles.infoLabel}>Fälligkeitsdatum</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Zahlungsbedingungen</Text>
              <Text style={styles.infoValue}>{invoice.paymentTerms}</Text>
            </View>
          </View>
        </View>

        {/* 항목 테이블 */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Pos.</Text>
            <Text style={styles.col2}>Beschreibung</Text>
            <Text style={styles.col3}>Menge</Text>
            <Text style={styles.col4}>Einheit</Text>
            <Text style={styles.col5}>Einzelpreis</Text>
            <Text style={styles.col6}>MwSt.</Text>
            <Text style={styles.col7}>Gesamt</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.description}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{item.unit}</Text>
              <Text style={styles.col5}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.col6}>{item.vatRate}%</Text>
              <Text style={styles.col7}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* 합계 */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Nettobetrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MwSt.:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.totalVat)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Bruttobetrag:</Text>
            <Text>{formatCurrency(invoice.totalGross)}</Text>
          </View>
        </View>

        {/* 노트 */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notizen:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* 조건 */}
        {invoice.terms && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Bedingungen:</Text>
            <Text>{invoice.terms}</Text>
          </View>
        )}

        {/* 푸터 */}
        <View style={styles.footer}>
          <Text>
            Vielen Dank für Ihr Vertrauen. Bei Fragen stehen wir Ihnen gerne zur Verfügung.
          </Text>
          <Text style={{ marginTop: 5 }}>
            {settings.companyName || 'Bridge Acc'} | Erstellt mit Bridge Acc
          </Text>
        </View>
      </Page>
    </Document>
  );
};
