import { LightningElement } from 'lwc';
import searchOpportunities from '@salesforce/apex/OpportunitySearchController.oppSearchList';
import saveCsv from '@salesforce/apex/OpportunitySearchController.saveCsv';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ExportCsvModal from 'c/exportCsvModal';

const SEARCH_DELAY = 500;

const COLUMN_OPTIONS = [
    { label: 'Opportunity Name', value: 'Name' },
    { label: 'Description', value: 'Description' },
    { label: 'Close Date', value: 'CloseDate' },
    { label: 'Amount', value: 'Amount' },
    { label: 'Next Step', value: 'NextStep' },
    { label: 'Account Name', value: 'accountName' }
];

const COLUMNS = [
    {label: 'Opportunity Name', fieldName: 'opportunityUrl', type: 'url',
        typeAttributes: {label: { fieldName: 'Name' },target: '_self'}
    },
    {label: 'Description', fieldName: 'Description', type: 'text'},
    {label: 'Close Date', fieldName: 'CloseDate', type: 'date'},
    {label: 'Amount', fieldName: 'Amount', type: 'currency'},
    {label: 'Next Step', fieldName: 'NextStep', type: 'text'},
    {label: 'Account Name', fieldName: 'accountUrl', type: 'url',
        typeAttributes: {label: { fieldName: 'accountName' },target: '_self'}
    }
];

export default class OpportunitySearch extends LightningElement {

    columns = COLUMNS;
    opportunities = [];
    searchKey = '';
    isLoading = false;

    delayTimeout;

    get isExportDisabled() {
        return this.opportunities.length === 0;
    }

    handleSearchChange(event) {

        this.searchKey = event.target.value;
        console.log('Search Key:', this.searchKey);
        clearTimeout(this.delayTimeout);

        if (!this.searchKey || !this.searchKey.trim()) {
            this.opportunities = [];
            return;
        }
        this.delayTimeout = setTimeout(() => {
            console.log('Calling Apex...');
            this.searchOpportunities();
        }, SEARCH_DELAY);
    }

    searchOpportunities() {
        this.isLoading = true;
        searchOpportunities({
            searchOpp: this.searchKey
        })
            .then(result => {
                console.log('Apex Result:', JSON.stringify(result));
                this.opportunities = result.map(record => ({
                    ...record,
                    opportunityUrl: '/' + record.Id,
                    accountName: record.Account ? record.Account.Name : '',
                    accountUrl: record.AccountId ? '/' + record.AccountId : ''
                }));
            })
            .catch(error => {
                this.opportunities = [];
                this.showToast(
                    'Error',
                    error.body?.message || 'Unable to retrieve opportunities.',
                    'error'
                );
            })
            .finally(() => {
                this.isLoading = false;
            });

    }

    async getIPAddress() {

        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error(error);
            return 'Unavailable';
        }
    }

    async handleExport() {

        try {

            const selectedColumns = await ExportCsvModal.open({
                size: 'small',
                columns: COLUMN_OPTIONS
            });
            console.log('Selected Columns:', selectedColumns);

            if (!selectedColumns) {
                return;
            }

            const csvData = this.generateCSV(selectedColumns);
            console.log(csvData);
            this.downloadCSV(csvData);

            const ipAddress = await this.getIPAddress();

            try {
                await saveCsv({
                    csvData: csvData,
                    searchTerm: this.searchKey,
                    ipAddress
                });

                console.log('Saved to Salesforce');
            } catch (error) {
                console.error(error);
            }

        } catch (error) {

            this.showToast(
                'Error',
                'Unable to export CSV.',
                'error'
            );

            alert(error.message);
        }
    }

    generateCSV(selectedColumns) {
        // Create CSV Header
        const headers = COLUMN_OPTIONS
            .filter(column => selectedColumns.includes(column.value))
            .map(column => column.label);

        // Create CSV Rows
        const rows = this.opportunities.map(record => {
            return selectedColumns.map(field => {
                let value = this.getFieldValue(record, field);
                if (value === null || value === undefined) {
                    value = '';
                }

                // Escape double quotes
                value = value.toString().replace(/"/g, '""');
                return `"${value}"`;
            }).join(',');
        });

        return [headers.join(','), ...rows].join('\n');

    }

    getFieldValue(record, field) {
        return record[field];
    }

    downloadCSV(csvData) {
        const element = document.createElement('a');
        element.setAttribute(
            'href',
            'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData)
        );
        element.setAttribute('download', 'OpportunityExport.csv');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}