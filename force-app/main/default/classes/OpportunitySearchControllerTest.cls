@isTest
private class OpportunitySearchControllerTest {

    @testSetup
    static void createTestData() {

        Account acc = new Account(
            Name = 'Test Account'
        );
        insert acc;

        Opportunity opp = new Opportunity(
            Name = 'Test Opportunity',
            AccountId = acc.Id,
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(15),
            Amount = 50000,
            Description = 'Test Opportunity Description',
            NextStep = 'Call Customer'
        );
        insert opp;
    }

    @isTest
    static void testOppSearchList_ByAccountName() {

        Test.startTest();

        List<Opportunity> opportunities =
            OpportunitySearchController.oppSearchList('Test Account');

        Test.stopTest();

        System.assertEquals(1, opportunities.size());
        System.assertEquals('Test Opportunity', opportunities[0].Name);
        System.assertEquals('Test Account', opportunities[0].Account.Name);
    }

    @isTest
    static void testOppSearchList_NoResults() {

        Test.startTest();

        List<Opportunity> opportunities =
            OpportunitySearchController.oppSearchList('XYZ123');

        Test.stopTest();

        System.assertEquals(0, opportunities.size());
    }

    @isTest
    static void testOppSearchList_BlankSearch() {

        Test.startTest();

        List<Opportunity> opportunities =
            OpportunitySearchController.oppSearchList('');

        Test.stopTest();

        System.assertEquals(0, opportunities.size());
    }

    @isTest
    static void testSaveCsv() {

        String csvData =
            'Opportunity Name,Amount\nTest Opportunity,50000';

        Test.startTest();

        OpportunitySearchController.saveCsv(
            csvData,
            'Test Account',
            '127.0.0.1'
        );

        Test.stopTest();

        ContentVersion cv = [
            SELECT Id,
                   Title,
                   Description
            FROM ContentVersion
            WHERE Title LIKE 'Opportunity Export%'
            LIMIT 1
        ];

        System.assertNotEquals(null, cv.Id);
        System.assert(
            cv.Description.contains('Test Account'),
            'Search term should be stored in Description'
        );
        System.assert(
            cv.Description.contains('127.0.0.1'),
            'IP Address should be stored in Description'
        );
    }
}