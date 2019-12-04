/**
 * @file
 * Automatically calculate total fields with non-trivial summation.
 * See foia_autocalc module for simple sum auto-calculations.
 */

(function ($, drupalSettings, Drupal) {

  'use strict';

  Drupal.behaviors.advcalc_field = {
    attach: function attach() {

      /**
       * Alias Drupal.FoiaUI utility functions
       */
      var specialNumber = Drupal.FoiaUI.specialNumber;
      var getAgencyComponent = Drupal.FoiaUI.getAgencyComponent;

      /**
       * Converts number back to "<1" if between 0 and 1.
       *
       * @param {number}
       * @returns {value}
       */
      function displayLessThan(number) {
        if (number > 0 && number < 1) {
          return "<1";
        }
        else {
          return number;
        }
      }

      /**
       * Check if a field has been marked as having been calculated on page load.
       *
       * @param {string} selector
       * @returns {boolean}
       */
      function fieldIsInitialized(selector) {
        var field = $(selector);

        if (field && field.length > 0) {
          return $(field.get(0)).hasClass('foia-advcalc-is-initialized');
        }

        return false;
      }

      /**
       * Add a class to a field to mark that it has been calculated on page load.
       *
       * @param selector
       */
      function markFieldInitialized(selector) {
        $(selector).addClass('foia-advcalc-is-initialized');
      }

      /**
       * Calculates overall value for a given component.
       *
       * @param {string} componentId
       *    The node edit paragraph component HTML fragment ID.
       * @param {string} componentFieldName
       *    The paragraph component field machine name.
       * @param {string} overallFieldID
       *    The calculated overall field HTML fragment ID.
       * @param {string} operator
       *    The operation to be performed, "<" or ">".
       */
      function calcOverall(componentId, componentFieldName, overallFieldID, operator) {
        // Calculate the initial value of the field.
        var fields = $("input[id^='" + componentId + "']").filter("input[name*='" + componentFieldName + "']");
        if (!fieldIsInitialized('#' + overallFieldID)) {
          var value = calculateBoundaryOfSet(fields, operator);
          $('#' + overallFieldID).val(value);
          markFieldInitialized('#' + overallFieldID);
        }

        fields.each(function() {
          $(this).once('advCalcOverall').on('change', {overallFieldID: overallFieldID, operator: operator}, function(event) {
            var output = calculateBoundaryOfSet(fields, event.data.operator);
            $('#' + event.data.overallFieldID).val(output);
          });
        });
      }

      /**
       * Compares the values of a set of fields, returning either the upper or lower bound of the set.
       *
       * @param fields
       *   A jquery object containing a set of fields.
       * @param operator
       *   Either less than or greater than depending on which boundary of the set should be retrieved.
       * @returns {*}
       */
      function calculateBoundaryOfSet(fields, operator) {
        var ops = {
          '<': function(a, b) { return a < b },
          '>': function(a, b) { return a > b },
        };
        var output = null;
        var isOverallNA = true;
        fields.each(function () {
          var value = $(this).val();
          if (String(value).toLowerCase() != 'n/a') {
            isOverallNA = false;
            if (value != '' && value !== null && (output == null || output == "n/a")) {
              // Set output for the first valid value.
              output = displayLessThan(specialNumber(value));
            }
            else if(value != '' && value != undefined && ops[operator](specialNumber(value), specialNumber(output))) {
              // Override output if operation criterion is met.
              output = displayLessThan(specialNumber(value));
            }
          }
        });
        // Clear overall value if output is "NaN".
        if (output !== output) {
          output = '';
        }
        // Set overall value to "N/A" if all fields are "N/A".
        else if (isOverallNA) {
          output = 'N/A';
        }

        return output;
      }

      /**
       * Calculate section X's overall percentage of total costs field.
       */
      function calculateOverallPercentageOfCosts() {
        var overall_x_total_fees = Number($("#edit-field-overall-x-total-fees-0-value").val());
        if ( overall_x_total_fees > 0 ) {
          var overall_ix_proc_costs = Number($("#edit-field-overall-ix-proc-costs-0-value").val());
          var overall_x_perc_costs =  overall_x_total_fees /overall_ix_proc_costs;
          var overall_x_perc_costs = Math.round(overall_x_perc_costs * 10000) / 10000; // Decimal format rounded to 4 places
          $('#edit-field-overall-x-perc-costs-0-value').val(overall_x_perc_costs);
        }
      }

      /**
       * Calculates V.A., VI.A., XII.B. Number of [type] Pending as of End of Fiscal Year per agency/component.
       *
       * e.g. req_pend_start_yr + req_received_yr - req_processed_yr = req_pend_end_yr
       *
       * @param {jquery} element
       *  jQuery object of field to trigger calculations for component.
       * @param {string} start
       *  Partial name attribute for selecting start year field.
       * @param {string} received
       *  Partial name attribute for selecting received year field.
       * @param {string} processed
       *  Partial name attribute for selecting processed year field.
       * @param {string} end
       *  Partial name attribute for selecting calculated end year field.
       */
      function calculatePendEndYr(element, start, received, processed, end) {
        var component = $(element).parents('.paragraphs-subform');
        var startVal = Number(component.find("input[name*='" + start + "']").val());
        var receivedVal = Number(component.find("input[name*='" + received + "']").val());
        var processedVal = Number(component.find("input[name*='" + processed + "']").val());
        var endVal = startVal + receivedVal - processedVal;
        component.find("input[name*='" + end + "']").val(endVal);
      }

      /**
       * Calculates V.A., VI.A., XII.B. Overall Number of [type] Pending as of End of Fiscal Year.
       *
       * e.g. req_pend_start_yr + req_received_yr - req_processed_yr = req_pend_end_yr
       *
       * @param {string} start
       *  Partial name attribute for selecting start year field.
       * @param {string} received
       *  Partial name attribute for selecting received year field.
       * @param {string} processed
       *  Partial name attribute for selecting processed year field.
       * @param {string} end
       *  Partial name attribute for selecting calculated end year field.
       */
      function calculateOverallPendEndYr(start, received, processed, end) {
        var startVal = Number($(start).val());
        var receivedVal = Number($(received).val());
        var processedVal = Number($(processed).val());
        var endVal = startVal + receivedVal - processedVal;
        $(end).val(endVal);
      }

      /**
       * Calculates perc_costs from total_fees divided by proc_costs.
       *
       * @param {jquery} proc_costs
       *   jQuery element for IX. Processing Costs.
       * @param {jquery} total_fees
       *   jQuery element for X. Total Amount of Fees Collected.
       * @param {jquery} perc_costs
       *   jQuery element for X. Percentage of Total Costs.
       *
       * @returns {jquery} perc_costs
       */
      function calcPercCosts(proc_costs, total_fees, perc_costs) {
        var perc_costs_val;
        if(total_fees.val() > 0) {
          //set value of target field
          perc_costs_val = total_fees.val() / proc_costs.val();
          perc_costs_val = Math.round(perc_costs_val * 10000) / 10000; // Decimal format rounded to 4 places
          $(perc_costs).val(perc_costs_val);
          return perc_costs;
        }
      }

      /**
       * Get input field based on changed field ID and agency_component value.
       *
       * @param {string} field
       *   String representation of field name, e.g. "x_total_fees".
       * @param {string} agency
       *   String representation of Agency/Component value, e.g. "8706".
       *
       * @returns {jquery}
       *   jQuery element for input field.
       */
      function getFieldByAgency(field, agency) {
        var result;
        var element;
        var element_agency;
        switch (field) {
          case 'x_total_fees':
            element = $( "input[name*='field_fees_x']").filter("input[name*='field_total_fees']");
            $(element).each(function() {
              element_agency = getAgencyComponent($(this));
              if (agency == element_agency) {
                result = $(this);
              }
            });
            break;
          case 'ix_proc_costs':
            element = $( "input[name*='field_foia_pers_costs_ix']").filter("input[name*='field_proc_costs']");
            $(element).each(function() {
              element_agency = getAgencyComponent($(this));
              if (agency == element_agency) {
                result = $(this);
              }
            });
            break;
          case 'x_perc_costs':
            element = $( "input[name*='field_fees_x']").filter("input[name*='field_perc_costs']");
            $(element).each(function() {
              element_agency = getAgencyComponent($(this));
              if (agency == element_agency) {
                result = $(this);
              }
            });
            break;
          default:
            result = false;
        }
        return $(result);
      }

      /**
       *  V.A. Number of Requests Pending as of End of Fiscal Year per agency/component
       */

      // V.A. Number of Requests Pending as of End of Fiscal Year
      $("input[name*='field_foia_requests_va']")
        .filter("input[name*='field_req_pend_start_yr'], input[name*='field_req_received_yr'], input[name*='field_req_processed_yr']")
          .each(function() {
            $(this).once('advCalcVAReqPendEndYr').change(function() {
              calculatePendEndYr(this, 'field_req_pend_start_yr', 'field_req_received_yr', 'field_req_processed_yr', 'field_req_pend_end_yr');
            });
      });

      // Initialize V.A. Number of Requests Pending as of End of Fiscal Year
      $("input[name*='field_foia_requests_va']")
        .once('initAdvCalcVIAppPendEndYr')
        .filter("input[name*='field_req_pend_end_yr']")
        .each(function() {
          if (!fieldIsInitialized(this)) {
            calculatePendEndYr(this, 'field_req_pend_start_yr', 'field_req_received_yr', 'field_req_processed_yr', 'field_req_pend_end_yr');
            markFieldInitialized(this);
          }
      });

      /**
       *  V.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
       */

      // Initialize on load: V.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
      if (!fieldIsInitialized('#edit-field-overall-req-pend-end-yr-0-value')) {
        calculateOverallPendEndYr(
          '#edit-field-overall-req-pend-start-yr-0-value',
          '#edit-field-overall-req-received-yr-0-value',
          '#edit-field-overall-req-processed-yr-0-value',
          '#edit-field-overall-req-pend-end-yr-0-value'
          );
        markFieldInitialized('#edit-field-overall-req-pend-end-yr-0-value');
      }

      // Calculate on change: V.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
      $("#edit-field-overall-req-pend-start-yr-0-value, #edit-field-overall-req-received-yr-0-value, #edit-field-overall-req-processed-yr-0-value")
        .once('advCalcVAOverallReqPendEndYr')
        .change(function() {
          calculateOverallPendEndYr(
            '#edit-field-overall-req-pend-start-yr-0-value',
            '#edit-field-overall-req-received-yr-0-value',
            '#edit-field-overall-req-processed-yr-0-value',
            '#edit-field-overall-req-pend-end-yr-0-value'
            );
        });

      /**
       *  VI.A. Number of Requests Pending as of End of Fiscal Year per agency/component
       */

      // Initialize VI.A. Number of Appeals Pending as of End of Fiscal Year
      $("input[name*='field_admin_app_via']")
        .once('initAdvCalcVIAppPendEndYr')
        .filter("input[name*='field_app_pend_end_yr']")
        .each(function() {
          if (!fieldIsInitialized(this)) {
            calculatePendEndYr(this, 'field_app_pend_start_yr', 'field_app_received_yr', 'field_app_processed_yr', 'field_app_pend_end_yr');
            markFieldInitialized(this);
          }
      });

      // VI.A. Number of Appeals Pending as of End of Fiscal Year
      $("input[name*='field_admin_app_via']")
        .filter("input[name*='field_app_pend_start_yr'], input[name*='field_app_received_yr'], input[name*='field_app_processed_yr']")
        .each(function() {
          $(this).once('advCalcVIAppPendEndYr')
            .change(function() {
              calculatePendEndYr(this, 'field_app_pend_start_yr', 'field_app_received_yr', 'field_app_processed_yr', 'field_app_pend_end_yr');
            });
      });

      /**
       *  VI.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
       */

      // Initialize on load: VI.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
      if (!fieldIsInitialized('#edit-field-overall-via-app-pend-endyr-0-value')) {
        calculateOverallPendEndYr(
          '#edit-field-overall-via-app-pend-start-0-value',
          '#edit-field-overall-via-app-recd-yr-0-value',
          '#edit-field-overall-via-app-proc-yr-0-value',
          '#edit-field-overall-via-app-pend-endyr-0-value'
          );
        markFieldInitialized('#edit-field-overall-via-app-pend-endyr-0-value');
      }

      // Calculate on change: VI.A. Agency Overall Number of Requests Pending as of End of Fiscal Year
      $("#edit-field-overall-req-pend-start-yr-0-value, #edit-field-overall-req-received-yr-0-value, #edit-field-overall-req-processed-yr-0-value")
        .once('advCalcVIOverallAppPendEndYr')
        .change(function() {
          calculateOverallPendEndYr(
            '#edit-field-overall-via-app-pend-start-0-value',
            '#edit-field-overall-via-app-recd-yr-0-value',
            '#edit-field-overall-via-app-proc-yr-0-value',
            '#edit-field-overall-via-app-pend-endyr-0-value'
            );
        });

      // Fields from section VI.C.(4) to calculate Lowest Number of Days.
      calcOverall('edit-field-admin-app-vic4', 'field_low_num_days', 'edit-field-overall-vic4-low-num-days-0-value', '<');
      // Fields from section VI.C.(4) to calculate Highest Number of Days.
      calcOverall('edit-field-admin-app-vic4', 'field_high_num_days', 'edit-field-overall-vic4-high-num-days-0-value', '>');

      // Fields from section VII.A. to calculate Lowest Number of Days.
      calcOverall('edit-field-proc-req-viia', 'field_sim_low', 'edit-field-overall-viia-sim-low-0-value', '<');
      // Fields from section VII.A. to calculate Highest Number of Days.
      calcOverall('edit-field-proc-req-viia', 'field_sim_high', 'edit-field-overall-viia-sim-high-0-value', '>');

      // Fields from section VII.A. to calculate Lowest Number of Days (complex).
      calcOverall('edit-field-proc-req-viia', 'field_comp_low', 'edit-field-overall-viia-comp-low-0-value', '<');
      // Fields from section VII.A. to calculate Highest Number of Days (complex).
      calcOverall('edit-field-proc-req-viia', 'field_comp_high', 'edit-field-overall-viia-comp-high-0-value', '>');

      // Fields from section VII.A. to calculate Lowest Number of Days (expedited).
      calcOverall('edit-field-proc-req-viia', 'field_exp_low', 'edit-field-overall-viia-exp-low-0-value', '<');
      // Fields from section VII.A. to calculate Highest Number of Days (expedited).
      calcOverall('edit-field-proc-req-viia', 'field_exp_high', 'edit-field-overall-viia-exp-high-0-value', '>');

      // Fields from section VII.B. to calculate Lowest Number of Days.
      calcOverall('edit-field-proc-req-viib', 'field_sim_low', 'edit-field-overall-viib-sim-low-0-value', '<');
      // Fields from section VII.B. to calculate Highest Number of Days.
      calcOverall('edit-field-proc-req-viib', 'field_sim_high', 'edit-field-overall-viib-sim-high-0-value', '>');

      // Fields from section VII.B. to calculate Lowest Number of Days (complex).
      calcOverall('edit-field-proc-req-viib', 'field_comp_low', 'edit-field-overall-viib-comp-low-0-value', '<');
      // Fields from section VII.B. to calculate Highest Number of Days (complex).
      calcOverall('edit-field-proc-req-viib', 'field_comp_high', 'edit-field-overall-viib-comp-high-0-value', '>');

      // Fields from section VII.B. to calculate Lowest Number of Days (expedited).
      calcOverall('edit-field-proc-req-viib', 'field_exp_low', 'edit-field-overall-viib-exp-low-0-value', '<');
      // Fields from section VII.B. to calculate Highest Number of Days (expedited).
      calcOverall('edit-field-proc-req-viib', 'field_exp_high', 'edit-field-overall-viib-exp-high-0-value', '>');

      /**
       * X. Percentage of Total Costs per agency/component.
       *
       * Fields from IX and X to calculate field_perc_costs per agency.
       * FOIA Personnel and Costs IX. proc_costs / Fees X. total_fees  = Fees X. perc_costs
       */

      // Initialize on load: X. Percentage of Total Costs
      $("input[name*='field_fees_x']")
        .once('initAdvCalcIXPercCosts')
        .filter("input[name*='field_total_fees']")
        .each(function() {
          if (!fieldIsInitialized(this)) {
            var proc_costs_agency_val = getAgencyComponent($(this));
            if(proc_costs_agency_val != '_none') {
              var total_fees = getFieldByAgency('ix_proc_costs', proc_costs_agency_val);
              var target = getFieldByAgency('x_perc_costs', proc_costs_agency_val);
              calcPercCosts($(this), total_fees, target);
            }
            markFieldInitialized(this);
          }
      });

      // If section IX proc_costs field changes.
      $( "input[name*='field_foia_pers_costs_ix']").filter("input[name*='field_proc_costs']").each(function() {
        $(this).once('advCalcIXPercCosts').change(function() {
          var proc_costs_agency_val = getAgencyComponent($(this));

          if(proc_costs_agency_val != '_none') {
            var total_fees = getFieldByAgency('x_total_fees', proc_costs_agency_val);
            var target = getFieldByAgency('x_perc_costs', proc_costs_agency_val);
            calcPercCosts($(this), total_fees, target);
          }
        });
      });

      // If section X total_fees field changes.
      $( "input[name*='field_fees_x']").filter("input[name*='field_total_fees']").each(function() {
        $(this).once('advCalcXPercCosts').change(function() {
          var total_fees_agency_val = getAgencyComponent($(this));

          if(total_fees_agency_val != '_none') {
            var proc_costs = getFieldByAgency('ix_proc_costs', total_fees_agency_val);
            var target = getFieldByAgency('x_perc_costs', total_fees_agency_val);
            calcPercCosts(proc_costs, $(this), target);
          }
        });
      });

      // Fields from sections IX and X to calculate overall_x_perc_costs.
      if (!fieldIsInitialized('#edit-field-overall-x-perc-costs-0-value')) {
        calculateOverallPercentageOfCosts();
        markFieldInitialized('#edit-field-overall-x-perc-costs-0-value');
      }
      $("#edit-field-overall-ix-proc-costs-0-value, #edit-field-overall-x-total-fees-0-value")
        .once('advCalcOverallXPercCosts')
        .change(function() {
          calculateOverallPercentageOfCosts();
      });

      /**
       *  XII.B. Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
       */

      // Initialize XII.B. Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
      $("input[name*='field_foia_xiib']")
        .once('initAdvCalcXIIBConPendEndYr')
        .filter("input[name*='field_pend_end_yr']")
        .each(function() {
          if (!fieldIsInitialized(this)) {
            calculatePendEndYr(this, 'field_pend_start_yr', 'field_con_during_yr', 'field_proc_start_yr', 'field_pend_end_yr');
            markFieldInitialized(this);
          }
      });

      // XII.B. Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
      $("input[name*='field_foia_xiib']")
        .filter("input[name*='field_pend_start_yr'], input[name*='field_con_during_yr'], input[name*='field_proc_start_yr']")
        .each(function() {
          $(this).once('advCalcXIIBConPendEndYr')
            .change(function() {
              calculatePendEndYr(this, 'field_pend_start_yr', 'field_con_during_yr', 'field_proc_start_yr', 'field_pend_end_yr');
            });
      });

      /**
       *  XII.B. Agency Overall Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
       */

      // Initialize on load: XII.B. Agency Overall Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
      if (!fieldIsInitialized('#edit-field-overall-xiib-pend-end-yr-0-value')) {
        calculateOverallPendEndYr(
          '#edit-field-overall-xiib-pend-start-yr-0-value',
          '#edit-field-overall-xiib-con-during-yr-0-value',
          '#edit-field-overall-xiib-proc-start-yr-0-value',
          '#edit-field-overall-xiib-pend-end-yr-0-value'
          );
        markFieldInitialized('#edit-field-overall-xiib-pend-end-yr-0-value');
      }

      // Calculate on change: XII.B. Agency Overall Number of Consultations Received from Other Agencies that were Pending at the Agency as of End of the Fiscal Year
      $("#edit-field-overall-xiib-pend-start-yr-0-value, #edit-field-overall-xiib-con-during-yr-0-value, #edit-field-overall-xiib-proc-start-yr-0-value")
        .once('advCalcXIIBOverallAppPendEndYr')
        .change(function() {
          calculateOverallPendEndYr(
            '#edit-field-overall-xiib-pend-start-yr-0-value',
            '#edit-field-overall-xiib-con-during-yr-0-value',
            '#edit-field-overall-xiib-proc-start-yr-0-value',
            '#edit-field-overall-xiib-pend-end-yr-0-value'
            );
        });
    }
  }
})(jQuery, drupalSettings, Drupal);
