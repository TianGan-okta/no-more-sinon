import { $, internal } from '@okta/core.common';
import AdHomeRouter from '../../src/AdHomeRouter';
import { ProvisionSettingsMultiTabController, AssignmentsController, ConvertAssigmentUtil, SignOnPreviewController } from '@okta/admin.appinstance/main/active-directory-home';
import { Controller as UserAssignmentController } from '@okta/admin.userassignment/main/appinstance';
import { ADGroupPushController } from '@okta/admin.grouppush';
const SettingsModel = internal.util.SettingsModel;
describe('active-directory-home/AdHomeRouter', function () {
  let ss;
  let router;
  let stub;

  const stubFunc = sandbox => ({
    hasFeature: jest.spyOn(SettingsModel.prototype, 'hasFeature').mockImplementation(() => {}),
    multiTabController: jest.spyOn(ProvisionSettingsMultiTabController.prototype, 'initialize').mockImplementation(() => {}),
    multiTabControllerRender: jest.spyOn(ProvisionSettingsMultiTabController.prototype, 'render').mockImplementation(() => {}),
    multiTabControllerRemove: jest.spyOn(ProvisionSettingsMultiTabController.prototype, 'remove').mockImplementation(() => {}),
    userAssignmentController: jest.spyOn(UserAssignmentController.prototype, 'initialize').mockImplementation(() => {}),
    userAssignmentControllerRender: jest.spyOn(UserAssignmentController.prototype, 'render').mockImplementation(() => {}),
    userAssignmentControllerRemove: jest.spyOn(UserAssignmentController.prototype, 'remove').mockImplementation(() => {}),
    assignmentsController: jest.spyOn(AssignmentsController.prototype, 'initialize').mockImplementation(() => {}),
    assignmentsControllerRender: jest.spyOn(AssignmentsController.prototype, 'render').mockImplementation(() => {}),
    convertAssignmentUtilInit: jest.spyOn(ConvertAssigmentUtil, 'init').mockImplementation(() => {}),
    adGroupPushController: jest.spyOn(ADGroupPushController.prototype, 'initialize').mockImplementation(() => {}),
    adGroupPushControllerRender: jest.spyOn(ADGroupPushController.prototype, 'render').mockImplementation(() => {}),
    adGroupPushControllerRemove: jest.spyOn(ADGroupPushController.prototype, 'remove').mockImplementation(() => {}),
    signOnPreviewControllerRender: jest.spyOn(SignOnPreviewController.prototype, 'render').mockImplementation(() => {}),
    signOnPreviewControllerRemove: jest.spyOn(SignOnPreviewController.prototype, 'remove').mockImplementation(() => {}),
    navigate: jest.spyOn(AdHomeRouter.prototype, 'navigate').mockImplementation(() => {})
  });

  beforeEach(function () {
    stub = stubFunc(ss);
    router = new AdHomeRouter({
      getGeneralTabLoadedPromise: () => $.Deferred().resolve()
    });
  });
  afterEach(function () {
    if (router && router.controller) {
      router._unloadAdditionalControllers();

      router.unload();
    }
  });
  it('Defaults to the assignments tab if SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD is enabled.', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD' ? true : null);
    router.navigateDefault();
    expect(stub.navigate).toHaveBeenCalledWith('tab-assignments', {
      trigger: true
    });
  });
  it('Defaults to the people tab if SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD is disabled.', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD' ? false : null);
    router.navigateDefault();
    expect(stub.navigate).toHaveBeenCalledWith('tab-people', {
      trigger: true
    });
  });
  it('Renders the ProvisioningSettingsMultiTabController when navigating to the general tab', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'AD_PROVISIONING' ? true : null);
    router.navigateGeneral();
    expect(stub.multiTabController).toHaveBeenCalledWith(expect.objectContaining({
      renderNoAdProvisioningMessage: false
    }));
    expect(stub.multiTabControllerRender).toHaveBeenCalledTimes(1);
  });
  it('Renders SignOnPreviewController on general tab if ENG_NEW_AD_INSTANCE_USING_UD_MAPPING enabled', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'ENG_NEW_AD_INSTANCE_USING_UD_MAPPING' ? true : null);
    router.navigateGeneral();
    expect(stub.signOnPreviewControllerRender).toHaveBeenCalledTimes(1);
  });
  it('Omits SignOnPreviewController on general tab if ENG_NEW_AD_INSTANCE_USING_UD_MAPPING disabled', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'ENG_NEW_AD_INSTANCE_USING_UD_MAPPING' ? false : null);
    router.navigateGeneral();
    expect(stub.signOnPreviewControllerRender).not.toHaveBeenCalled();
  });
  it('Renders "Provisioning not available for AD" message when AD_PROVISIONING is disabled', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'AD_PROVISIONING' ? false : null);
    router.navigateGeneral();
    expect(stub.multiTabController).toHaveBeenCalledWith(expect.objectContaining({
      renderNoAdProvisioningMessage: true
    }));
    expect(stub.multiTabControllerRender).toHaveBeenCalledTimes(1);
  });
  it('Renders the UserAssignmentController when navigating to the general tab', function () {
    router.navigatePeople();
    expect(router.controller).toEqual(expect.any(UserAssignmentController));
    expect(stub.userAssignmentController).toHaveBeenCalledTimes(1);
    expect(stub.userAssignmentControllerRender).toHaveBeenCalledTimes(1);
  });
  it('Renders the ADGroupPushController when navigating to the group push tab', function () {
    router.navigateGroupPush();
    expect(router.controller).toEqual(expect.any(ADGroupPushController));
    expect(stub.adGroupPushController).toHaveBeenCalledTimes(1);
    expect(stub.adGroupPushControllerRender).toHaveBeenCalledTimes(1);
  });
  it('Renders the AssignmentsController when navigating to the assignments tab', function () {
    router.navigateAssignments();
    expect(router.controller).toEqual(expect.any(AssignmentsController));
    expect(stub.assignmentsController).toHaveBeenCalledTimes(1);
    expect(stub.assignmentsControllerRender).toHaveBeenCalledTimes(1);
    expect(stub.convertAssignmentUtilInit).toHaveBeenCalledWith(router.controller.state);
  });
  it('Clears the current controller when navigating to an unrecognized hash URL', function () {
    stub.hasFeature.mockImplementation(arg => arg === 'ENG_NEW_AD_INSTANCE_USING_UD_MAPPING' ? true : null); // Loads the controller.

    router.navigateGeneral();
    expect(router.controller instanceof ProvisionSettingsMultiTabController).toBe(true);
    expect(stub.multiTabController).toHaveBeenCalled();
    expect(stub.signOnPreviewControllerRender).toHaveBeenCalledTimes(1);
    expect(stub.multiTabControllerRemove).not.toHaveBeenCalled(); // Unloads the controller.

    router.navigateAway();
    expect(router.controller).toBe(null);
    expect(stub.multiTabControllerRemove).toHaveBeenCalledTimes(1);
    expect(stub.signOnPreviewControllerRemove).toHaveBeenCalledTimes(1);
  });
  it('Updates the hash URL when the user navigates between settings sections.', function () {
    router.navigateGeneral();
    expect(router.controller).toEqual(expect.any(ProvisionSettingsMultiTabController));
    router.controller.state.set('provisionSubFilter', 'import-n-mastering');
    expect(stub.navigate).toHaveBeenCalledWith('tab-general/import-n-mastering');
    router.controller.state.set('provisionSubFilter', 'create-n-update');
    expect(stub.navigate).toHaveBeenCalledWith('tab-general/create-n-update');
    router.controller.state.set('provisionSubFilter', null);
    expect(stub.navigate).toHaveBeenCalledWith('tab-general');
    router.controller.state.set('provisionSubFilter', '');
    expect(stub.navigate).toHaveBeenCalledWith('tab-general');
  });
});