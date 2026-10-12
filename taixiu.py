import random
import time
import os
money = float(input("Nhập số tiền cần nạp: "))
money = round(money,2)
while True:
    while True:
        player = input("tài hay xỉu: ")
        player = player.lower()
        if player != "tài" and player != "xỉu":
            print("vui lòng chọn tài hoặc xỉu")
        else:
            break
    while True:
        bet = float(input("Nhập số tiền cược: "))
        bet = round(bet,2)
        if (bet > money):
            print("Vui lòng nhập số tiền cược thấp hơn hoặc bằng số tiền nạp")
        else:
            break
    if money == bet:
        print("vcl thằng này all in ạ")
        time.sleep(1)
        print("thế thua em nhé")
        time.sleep(1)
        print("bạn đã bị nhà cái bịp")
        print(f"bạn mất {bet}$")
        money = money - bet
        print(f"bạn còn lại {money}$ trong tài khoản")
    else:
        money = money - bet
        xx1 = random.randint(1,6)
        xx2 = random.randint(1,6)
        xx3 = random.randint(1,6)
        sum = xx1 + xx2 + xx3
        print("kết quả")
        time.sleep(2)
        print("xúc xắc thứ nhất là:",xx1)
        time.sleep(2)
        print("xúc xắc thứ hai là:",xx2)
        time.sleep(2)
        print("xúc xắc thứ ba là:",xx3)
        if player == "tài" and sum > 10:
            print("bạn đã chiến thắng")
            print(f"số tiền chiến thắng: {bet*198/100}$")
            money += bet*198/100
            money = round(money,2)
            print(f"Bạn có {money}$ trong tài khoản")
        elif player == "xỉu" and sum <= 10:
            print("bạn đã chiến thắng")
            print(f"số tiền chiến thắng: {bet*198/100}$")
            money += bet*198/100
            money = round(money,2)
            print(f"Bạn có {money}$ trong tài khoản")
        else:
            print("bạn đã thua nhà cái")
            print(f"bạn mất {bet}$")
            print(f"bạn còn lại {money}$ trong tài khoản")
    if money == 0:
        for i in range(4):
            print(".",end="")
            time.sleep(1)
        print()
        for i in range(4):
            print(".",end="")
            time.sleep(1)
        print()
        print("đánh ngu vãi đái hết m tiền rồi")
        break
    print("Bạn còn muốn chơi tiếp không: có hoặc không")
    while True:
        choose = input("Câu trả lời: ")
        choose = choose.lower()
        if choose == "có":
            break
        else:
            print("dm thế là có hay không hả thag ngu")
    if choose == "không":
        break
