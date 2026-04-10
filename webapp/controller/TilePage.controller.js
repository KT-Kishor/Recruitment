sap.ui.define(
    [
        "./BaseController",
        "sap/m/MessageToast",
        "../utils/validation",
        "sap/ui/model/json/JSONModel"
    ],
    function (BaseController, MessageToast, utils, JSONModel) {
        "use strict";
        return BaseController.extend(
            "kt.ai.sap.com.recruitment.TilePage", {
            onInit: function () {
                this._autoScrollTimer = null;
                const model = new JSONModel({
            // for Database connection
            url: "https://rest.kalpavrikshatechnologies.com/",
            headers: {
              name: "$2a$12$LC.eHGIEwcbEWhpi9gEA.umh8Psgnlva2aGfFlZLuMtPFjrMDwSui",
              password:
                "$2a$12$By8zKifvRcfxTbabZJ5ssOsheOLdAxA2p6/pdaNvv1xy1aHucPm0u",
              "Content-Type": "application/json",
            },
            isRadioVisible: false,
          });
          this.getOwnerComponent().setModel(model, "LoginModel");
                this.getRouter().getRoute("RouteTilePage").attachMatched(this._onRouteMatched, this);
            },

            onExit: function () {
                // 3. Final, essential cleanup
                if (this._autoScrollTimer) {
                    clearInterval(this._autoScrollTimer);
                }
            },

            _onRouteMatched: async function () {
                var model = new JSONModel({ RaiseVisible: false });
                this.getView().setModel(model, "VisibleModel");
                if (!this.that)
                    this.that = this.getOwnerComponent().getModel("ThisModel")?.getData().that;
                var LoginFunction = await this.commonLoginFunction("TilePage");
                if (!LoginFunction) return;
                this.scrollToSection("id_ObjectPageLayoutTile", "id_Sectiontile");
                this.getBusyDialog();
                this.i18nModel = this.getView().getModel("i18n").getResourceBundle();
                this.byId("id_ObjectPageLayoutTile").setSelectedSection('0');
                this.AppVisibilityReadCall();

                let data = await this.ajaxReadWithJQuery("getDashboardEndingSoonSummary", {});
                var oEndingSoonModel = new JSONModel({ "notificationCount": data.data });
                this.getOwnerComponent().setModel(oEndingSoonModel, "EndingSoonModel");

                await this._fetchCommonData("AllLoginDetails", "EmpModel");
                await this._fetchCommonData("EmployeeDetails", "EmpDetails");
                await this._fetchCommonData("Trainee", "traineePayslipModel", { Type: "Stipend" });
                let count = await this.ajaxReadWithJQuery("InboxDetailsSubmittedCount", { ManagerID: this.getView().getModel("LoginModel").getProperty("/EmployeeID") });
                this.getView().getModel("TileAccessModel").setProperty("/SubmittedCount", count.submittedCount)
                this.CreateEmployeeModel();
                this.initializeBirthdayCarousel();

                var model = new JSONModel({
                    AppName: "",
                    BugDescription: "",
                    RaisedBy: this.getView().getModel("LoginModel").getProperty("/EmployeeName"),
                    Email: "",
                    attachments: [],
                    tokens: [],
                    Submit: true,
                    Save: false
                });
                this.getView().setModel(model, "RaiseBugModel")


            },

            CreateEmployeeModel: function () {
                var empData = this.getView().getModel("EmpDetails").getData() || [];
                var filteredEmpData = empData.filter(function (item) {
                    return item.Role !== "Contractor" && item.Role !== "Trainee";
                });
                var traineeData = this.getView().getModel("traineePayslipModel").getData() || [];
                var filteredTrainees = traineeData.filter(function (item) {
                    return item.Status === "Onboarded" || item.Status === "Training Completed";
                });
                var normalizedTrainees = filteredTrainees.map(function (item) {
                    return {
                        EmployeeID: item.TraineeID,
                        EmployeeName: item.TraineeName
                    };
                });
                var combinedData = filteredEmpData.concat(normalizedTrainees);
                var oFilteredModel = new sap.ui.model.json.JSONModel(combinedData);
                this.getOwnerComponent().setModel(oFilteredModel, "EmployeeModel");
            },

            AppVisibilityReadCall: async function () {
                try {
                    const oLoginModel = this.getView().getModel("LoginModel");
                    if (!oLoginModel) return;

                    const { Role } = oLoginModel.getData();
                    const oData = await this.ajaxReadWithJQuery("AppVisibility", { Role }, []);
                    this.closeBusyDialog();

                    const firstEntry = Array.isArray(oData.data) ? oData.data[0] : oData.data;
                    this.getOwnerComponent().setModel(new JSONModel(firstEntry), "AppVisibilityModel");

                    const tileNames = ["Home", "Timesheet", "Payslip", "OfferGeneration", "Invoice", "Quotation", "Expense", "ManageAsset", "Recruitment",];

                    const tileKeys = firstEntry.TileKey?.split(",") || [];
                    const tileMapping = tileNames.reduce((map, name, i) => {
                        map[name] = tileKeys[i] || "0";
                        return map;
                    }, {});

                    this.getView().setModel(new JSONModel(tileMapping), "TileAccessModel");
                } catch (oError) {
                    MessageToast.show("Error in AppVisibilityReadCall");
                }
            },

            TileV_RecruitementDashbord: function () {
                this.getRouter().navTo("AppliedCandidates");
            },

            TileV_JobPosting: function () {
                this.getRouter().navTo("RouteHP_View");
            },
        });
    });