import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ExportCsvModal extends LightningModal {

    @api columns = [];

    selectedColumns = [];

    connectedCallback() {
        // Select all columns by default
        this.selectedColumns = this.columns.map(column => column.value);
    }

    handleSelectionChange(event) {
        this.selectedColumns = event.detail.value;
    }

    get isExportDisabled() {
        return this.selectedColumns.length === 0;
    }

    handleCancel() {
        this.close();
    }

    handleExport() {
        console.log(this.selectedColumns);
        this.close(this.selectedColumns);
    }

}