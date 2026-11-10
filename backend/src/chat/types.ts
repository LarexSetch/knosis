export type SenderType = 'Agent' | 'User';

export interface ChatAgent {
    messages(): Message[];
    reply(message: Message): Promise<Message>;
}

export interface Message {
    id: string;
    content: string;
    timestamp: number;
    sender: SenderType;
}

