import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, QueryFailedError } from 'typeorm'

import { Friendship, FriendshipStatus } from './entities/friend.entity'
import { User } from '../users/entities/user.entity'

import { FriendResponseDto } from './dto/friend-response.dto'
import { FriendRequestResponseDto } from './dto/friend-request-response.dto'

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async areFriends(userAId: number, userBId: number): Promise<boolean> {
        if (userAId === userBId)
            return false;
        return this.friendshipRepository.exists({
            where: [
                {
                    requesterId: userAId,
                    addresseeId: userBId,
                    status: FriendshipStatus.ACCEPTED,
                },
                {
                    requesterId: userBId,
                    addresseeId: userAId,
                    status: FriendshipStatus.ACCEPTED,
                },
            ],
        });
    }

    async sendFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship> {
        if (requesterId === addresseeId)
            throw new BadRequestException('You cannot send a request to yourself');

        const addresseeExists = await this.userRepository.exists({
            where: {id: addresseeId},
        });
        if (!addresseeExists)
            throw new NotFoundException('User not found');

        const existing = await this.friendshipRepository.findOne({
            where: [
                { requesterId, addresseeId }, 
                { requesterId: addresseeId, addresseeId: requesterId },
                ],
        });

        if (existing) {
            throw new ConflictException('You are already friends or have a friendship request');
        }

        const friendship = await this.friendshipRepository.create({
            requesterId, 
            addresseeId,
            status: FriendshipStatus.PENDING,
        });

        try {
            return await this.friendshipRepository.save(friendship);
        }
        catch (error: unknown) {
            if (error instanceof QueryFailedError) {
                const driverError = error.driverError as {
                    code?: string;
                    constraint?: string;
                };
                if (driverError.code === '23505' && driverError.constraint === 'UQ_friendships_pair') {
                    throw new ConflictException('You are already friends or have a friendship request');
                }
            }
            throw error;
        }
    }

    async acceptFriendRequest(friendshipId: number, currentUserId: number): Promise<void> {
        const friendship = await this.friendshipRepository.findOne({
            where: {id: friendshipId},
        });

        if (!friendship)
            throw new NotFoundException('Friend request not found');

        if (friendship.addresseeId !== currentUserId)
            throw new ForbiddenException('You cannot accept this friend request');

        if (friendship.status !== FriendshipStatus.PENDING)
            throw new ConflictException('The friend request is not pending');

        const result = await this.friendshipRepository.update(
            {
                id: friendshipId,
                addresseeId: currentUserId, 
                status: FriendshipStatus.PENDING
            },
            {
                status: FriendshipStatus.ACCEPTED,
                acceptedAt: new Date(),
            },
        );

        if (result.affected != 1)
            throw new ConflictException('The friend request could not be accepted');
    }

    async rejectFriendRequest(friendshipId: number, currentUserId: number): Promise<void> {
        const friendship = await this.friendshipRepository.findOne({
            where: {id: friendshipId},
        });
        
        if (!friendship)
            throw new NotFoundException('Friendship request not found');
    
        if (friendship.addresseeId !== currentUserId)
            throw new ForbiddenException('You cannot reject this request');

        if (friendship.status !== FriendshipStatus.PENDING)
            throw new ConflictException('This request is not pending');

        const result = await this.friendshipRepository.delete({
            id: friendshipId,
            addresseeId: currentUserId,
            status: FriendshipStatus.PENDING,
        });

        if (result.affected !== 1)
            throw new ConflictException('This requested could not be rejected');
    }

    async cancelFriendRequest(friendshipId: number, currentUserId: number): Promise<void> {
        const friendship = await this.friendshipRepository.findOne({
            where: {id: friendshipId},
        });

        if (!friendship)
            throw new NotFoundException('Friendship request not found');

        if (friendship.requesterId !== currentUserId)
            throw new ForbiddenException('You cannot cancel this request');

        if (friendship.status !== FriendshipStatus.PENDING)
            throw new ConflictException('This request is not pending');

        const result = await this.friendshipRepository.delete({
            id: friendshipId,
            requesterId: currentUserId,
            status: FriendshipStatus.PENDING,
        });

        if (result.affected !== 1)
            throw new ConflictException('This request could not be canceled');
    }

    async removeFriend(friendshipId: number, currentUserId: number): Promise<void> {
        const friendship = await this.friendshipRepository.findOne({
            where: {id: friendshipId},
        });

        if (!friendship)
            throw new NotFoundException('Friendship not found');

        if (currentUserId !== friendship.requesterId && currentUserId !== friendship.addresseeId)
            throw new ForbiddenException('You cannot remove this friend');

        if (friendship.status !== FriendshipStatus.ACCEPTED)
            throw new ConflictException('This friendship is not accepted');

        const result = await this.friendshipRepository
            .createQueryBuilder()
            .delete()
            .from(Friendship)
            .where('id = :friendshipId', { friendshipId })
            .andWhere('status = :status', { status: FriendshipStatus.ACCEPTED })
            .andWhere('requesterId = :currentUserId OR addresseeId = :currentUserId', { currentUserId })
            .execute();

        if (result.affected !== 1)
            throw new ConflictException('This friendship could not be removed');
    }

    async getFriends(userID: number): Promise<FriendResponseDto[]> {
        const friendships = await this.friendshipRepository.find({
            where: [
                {
                    requesterId: userID,
                    status: FriendshipStatus.ACCEPTED,
                },
                {
                    addresseeId: userID, 
                    status: FriendshipStatus.ACCEPTED,
                },
            ],
            relations: {
                requester: true,
                addressee: true,
            },
            order: {
                acceptedAt: 'DESC',
            },
        });

        return friendships.map((friendship) => {
            const friend = friendship.requesterId ? friendship.addressee : friendship.requester;
            return {
                friendshipId: friendship.id,
                user: {
                    id: friend.id,
                    username: friend.username,
                },
                friendsSince: friendship.acceptedAt,
            };
        });
    }

    async getIncomingRequests(userId: number): Promise<FriendRequestResponseDto[]> {
        const requests = await this.friendshipRepository.find({
            where: {
                addresseeId: userId,
                status: FriendshipStatus.PENDING,
            },
            relations: { requester : true },
            order: {createdAt: 'DESC'},
        });
        return requests.map((request) => ({
            id: request.id,
            user: {
                id: request.requester.id,
                username: request.requester.username,
            },
            createdAt: request.createdAt,
        }));
    }

    async getOutgoingRequests(userId: number): Promise<FriendRequestResponseDto[]> {
        const requests = await this.friendshipRepository.find({
            where: {
                requesterId: userId,
                status: FriendshipStatus.PENDING,
            },
            relations: { addressee: true },
            order: { createdAt: 'DESC' },
        });
        return requests.map((request) => ({
            id: request.id,
            user: {
                id: request.addressee.id,
                username: request.addressee.username,
            },
            createdAt: request.createdAt,
        }));
    }

}