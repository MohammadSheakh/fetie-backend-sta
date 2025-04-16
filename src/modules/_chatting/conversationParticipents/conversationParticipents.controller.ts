import { GenericController } from "../../__Generic/generic.controller";
import { IConversation } from "../conversation/conversation.interface";
import { ConversationParticipents } from "./conversationParticipents.model";

import {  ConversationParticipentsService } from "./conversationParticipents.service";

export class ConversationParticipentsController extends GenericController<typeof ConversationParticipents, IConversation> {
    constructor(){
        super(new ConversationParticipentsService(), "Conversation Participents")
    }

    // add more methods here if needed or override the existing ones
}