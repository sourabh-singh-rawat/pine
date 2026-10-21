import {
  type CloudEvent,
  type IBroker,
  type IdentityEmailVerifiedData,
  Streams,
  Consumer,
  IdentityEmailVerifiedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { IPersonalOnboardingService } from "@/features/personal-onboarding/services";

@injectable()
export class PersonalOnboardingConsumer extends Consumer<CloudEvent<IdentityEmailVerifiedData>> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "platform-personal-onboarding";
  readonly subjects = [IdentityEmailVerifiedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.PersonalOnboardingService)
    private readonly personalOnboardingService: IPersonalOnboardingService,
  ) {
    super(broker);
  }

  onMessage = async (
    message: JsMsg,
    payload: CloudEvent<IdentityEmailVerifiedData>,
  ): Promise<void> => {
    const event = validateEvent(IdentityEmailVerifiedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    await this.personalOnboardingService.provisionPersonalOrganization(data.userId);
    message.ack();
  };
}
