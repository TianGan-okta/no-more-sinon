import { $, internal } from '@okta/core.common';
import sinon from 'sinon';
import AdHomeRouter from '../../src/AdHomeRouter';
import { ProvisionSettingsMultiTabController, AssignmentsController, ConvertAssigmentUtil, SignOnPreviewController }
  from '@okta/admin.appinstance/main/active-directory-home';
import { Controller as UserAssignmentController } from '@okta/admin.userassignment/main/appinstance';
import { ADGroupPushController } from '@okta/admin.grouppush';

const SettingsModel = internal.util.SettingsModel;

describe('active-directory-home/AdHomeRouter', function() {
  let ss;
  let router;
  let stub;
  const stubFunc = (sandbox) => ({
    hasFeature: sandbox.stub(SettingsModel.prototype, 'hasFeature'),
    multiTabController: sandbox.stub(ProvisionSettingsMultiTabController.prototype, 'initialize'),
    multiTabControllerRender: sandbox.stub(ProvisionSettingsMultiTabController.prototype, 'render'),
    multiTabControllerRemove: sandbox.stub(ProvisionSettingsMultiTabController.prototype, 'remove'),
    userAssignmentController: sandbox.stub(UserAssignmentController.prototype, 'initialize'),
    userAssignmentControllerRender: sandbox.stub(UserAssignmentController.prototype, 'render'),
    userAssignmentControllerRemove: sandbox.stub(UserAssignmentController.prototype, 'remove'),
    assignmentsController: sandbox.stub(AssignmentsController.prototype, 'initialize'),
    assignmentsControllerRender: sandbox.stub(AssignmentsController.prototype, 'render'),
    convertAssignmentUtilInit: sandbox.stub(ConvertAssigmentUtil, 'init'),
    adGroupPushController: sandbox.stub(ADGroupPushController.prototype, 'initialize'),
    adGroupPushControllerRender: sandbox.stub(ADGroupPushController.prototype, 'render'),
    adGroupPushControllerRemove: sandbox.stub(ADGroupPushController.prototype, 'remove'),
    signOnPreviewControllerRender: sandbox.stub(SignOnPreviewController.prototype, 'render'),
    signOnPreviewControllerRemove: sandbox.stub(SignOnPreviewController.prototype, 'remove'),
    navigate: sandbox.stub(AdHomeRouter.prototype, 'navigate'),
  });

  beforeEach(function() {
    ss = sinon.createSandbox();
    stub = stubFunc(ss);
    router = new AdHomeRouter({
      getGeneralTabLoadedPromise: () => $.Deferred().resolve(),
    });
  });

  afterEach(function() {
    if (router && router.controller) {
      router._unloadAdditionalControllers();
      router.unload();
    }

    ss.restore();
  });

  it('Defaults to the assignments tab if SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD is enabled.', function() {
    stub.hasFeature.withArgs('SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD').returns(true);
    router.navigateDefault();

    expect(stub.navigate.calledWith('tab-assignments', { trigger: true })).toEqual(true);
  });

  it('Defaults to the people tab if SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD is disabled.', function() {
    stub.hasFeature.withArgs('SUPPORT_USER_MOVES_ACROSS_OUS_IN_AD').returns(false);
    router.navigateDefault();

    expect(stub.navigate.calledWith('tab-people', { trigger: true })).toEqual(true);
  });

  it('Renders the ProvisioningSettingsMultiTabController when navigating to the general tab', function() {
    stub.hasFeature.withArgs('AD_PROVISIONING').returns(true);
    router.navigateGeneral();

    expect(
      stub.multiTabController.calledWith(
        sinon.match({
          renderNoAdProvisioningMessage: false,
        }),
      ),
    ).toBe(true);

    expect(stub.multiTabControllerRender.calledOnce).toBe(true);
  });

  it('Renders SignOnPreviewController on general tab if ENG_NEW_AD_INSTANCE_USING_UD_MAPPING enabled', function() {
    stub.hasFeature.withArgs('ENG_NEW_AD_INSTANCE_USING_UD_MAPPING').returns(true);
    router.navigateGeneral();

    expect(stub.signOnPreviewControllerRender.calledOnce).toBe(true);
  });

  it('Omits SignOnPreviewController on general tab if ENG_NEW_AD_INSTANCE_USING_UD_MAPPING disabled', function() {
    stub.hasFeature.withArgs('ENG_NEW_AD_INSTANCE_USING_UD_MAPPING').returns(false);
    router.navigateGeneral();

    expect(stub.signOnPreviewControllerRender.notCalled).toBe(true);
  });

  it('Renders "Provisioning not available for AD" message when AD_PROVISIONING is disabled', function() {
    stub.hasFeature.withArgs('AD_PROVISIONING').returns(false);
    router.navigateGeneral();

    expect(
      stub.multiTabController.calledWith(
        sinon.match({
          renderNoAdProvisioningMessage: true,
        }),
      ),
    ).toBe(true);

    expect(stub.multiTabControllerRender.calledOnce).toBe(true);
  });

  it('Renders the UserAssignmentController when navigating to the general tab', function() {
    router.navigatePeople();

    expect(router.controller).toEqual(expect.any(UserAssignmentController));
    expect(stub.userAssignmentController.calledOnce).toBe(true);
    expect(stub.userAssignmentControllerRender.calledOnce).toBe(true);
  });

  it('Renders the ADGroupPushController when navigating to the group push tab', function() {
    router.navigateGroupPush();

    expect(router.controller).toEqual(expect.any(ADGroupPushController));
    expect(stub.adGroupPushController.calledOnce).toBe(true);
    expect(stub.adGroupPushControllerRender.calledOnce).toBe(true);
  });

  it('Renders the AssignmentsController when navigating to the assignments tab', function() {
    router.navigateAssignments();

    expect(router.controller).toEqual(expect.any(AssignmentsController));
    expect(stub.assignmentsController.calledOnce).toBe(true);
    expect(stub.assignmentsControllerRender.calledOnce).toBe(true);
    expect(stub.convertAssignmentUtilInit.calledWith(router.controller.state)).toBe(true);
  });

  it('Clears the current controller when navigating to an unrecognized hash URL', function() {
    stub.hasFeature.withArgs('ENG_NEW_AD_INSTANCE_USING_UD_MAPPING').returns(true);

    // Loads the controller.
    router.navigateGeneral();
    expect(router.controller instanceof ProvisionSettingsMultiTabController).toBe(true);
    expect(stub.multiTabController.called).toBe(true);
    expect(stub.signOnPreviewControllerRender.calledOnce).toBe(true);
    expect(stub.multiTabControllerRemove.notCalled).toBe(true);

    // Unloads the controller.
    router.navigateAway();
    expect(router.controller).toBe(null);
    expect(stub.multiTabControllerRemove.calledOnce).toBe(true);
    expect(stub.signOnPreviewControllerRemove.calledOnce).toBe(true);
  });

  it('Updates the hash URL when the user navigates between settings sections.', function() {
    router.navigateGeneral();
    expect(router.controller).toEqual(expect.any(ProvisionSettingsMultiTabController));

    router.controller.state.set('provisionSubFilter', 'import-n-mastering');
    expect(stub.navigate.calledWith('tab-general/import-n-mastering')).toBe(true);

    router.controller.state.set('provisionSubFilter', 'create-n-update');
    expect(stub.navigate.calledWith('tab-general/create-n-update')).toBe(true);

    router.controller.state.set('provisionSubFilter', null);
    expect(stub.navigate.calledWith('tab-general')).toBe(true);

    router.controller.state.set('provisionSubFilter', '');
    expect(stub.navigate.calledWith('tab-general')).toBe(true);
  });
});
