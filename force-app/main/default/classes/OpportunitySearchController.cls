public with sharing class OpportunitySearchController {
    
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> oppSearchList(String searchOpp){
        if(String.isBlank(searchOpp)){
            return new List<Opportunity>();
        }

        String keyword = '%'+searchOpp.trim()+'%';

        Decimal amountValue;
        Date closeDateValue;

        try {
            amountValue = Decimal.valueOf(searchOpp);
        } catch (Exception e) {
            amountValue = null;
        }

        try {
            closeDateValue = Date.valueOf(searchOpp);
        } catch (Exception e) {
            closeDateValue = null;
        }

        List<Opportunity> OpportunityList = [Select Id, Name, Description, CloseDate, Amount, NextStep, AccountId, Account.Name 
                                            From Opportunity Where Account.Name Like :keyword
                                                                    OR Amount = :amountValue
                                                                    OR CloseDate = :closeDateValue
                                                                ORDER BY LastModifiedDate DESC
                                                                LIMIT 200 ];
        return OpportunityList;
    }

    @AuraEnabled
    public static void saveCsv(String csvData, String searchTerm, String ipAddress) {

        ContentVersion cv = new ContentVersion();

        cv.Title = 'Opportunity Export - ' + DateTime.now().format('yyyy-MM-dd HH:mm');

        cv.PathOnClient = 'OpportunityExport.csv';

        cv.VersionData = Blob.valueOf(csvData);

        cv.Description =
            'Downloaded By : ' + UserInfo.getName() +
            '\nSearch Term : ' + searchTerm +
            '\nIP Address : ' + ipAddress;

        insert cv;
    }
        
}